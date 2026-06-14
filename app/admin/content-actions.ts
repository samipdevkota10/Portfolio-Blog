"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminContext } from "@/lib/auth";
import {
  deleteExperienceRow,
  deletePostRow,
  deleteProjectRow,
  getExperienceRow,
  getPostRow,
  getProjectRow,
  upsertExperience,
  upsertPost,
  upsertProject,
} from "@/lib/db/content-queries";
import type { RichTextDoc } from "@/lib/content/richtext";
import { reindexDocument, removeDocumentFromIndex } from "@/lib/ai/ingest";
import { uploadPublicFile } from "@/lib/firebase/storage";
import { logger } from "@/lib/logger";

const bodyJsonSchema = z.string().transform((value, ctx): RichTextDoc => {
  try {
    const parsed = JSON.parse(value) as RichTextDoc;
    if (!parsed || parsed.type !== "doc") {
      throw new Error("Invalid document root");
    }
    return parsed;
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid body content" });
    return z.NEVER;
  }
});

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and dashes");

const postInputSchema = z.object({
  id: z.string().min(1).optional(),
  slug: slugSchema,
  title: z.string().min(1).max(255),
  summary: z.string().min(1),
  bodyJson: bodyJsonSchema,
  bodyHtml: z.string(),
  bodyText: z.string(),
  tags: z.array(z.string().min(1)).min(1),
  coverImage: z.string().url().optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
});

const projectInputSchema = z.object({
  id: z.string().min(1).optional(),
  slug: slugSchema,
  title: z.string().min(1).max(255),
  summary: z.string().min(1),
  bodyJson: bodyJsonSchema,
  bodyHtml: z.string(),
  bodyText: z.string(),
  role: z.string().min(1).max(160),
  technologies: z.array(z.string().min(1)).min(1),
  impact: z.array(z.string().min(1)).min(1),
  githubUrl: z.string().url().optional().or(z.literal("")),
  liveUrl: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
});

const experienceInputSchema = z.object({
  id: z.string().min(1).optional(),
  slug: slugSchema,
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(160),
  location: z.string().min(1).max(160),
  summary: z.string().min(1),
  bodyJson: bodyJsonSchema,
  bodyHtml: z.string(),
  bodyText: z.string(),
  technologies: z.array(z.string().min(1)).min(1),
  featured: z.boolean(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});

export type ActionResult = { ok: true; id: string; slug: string } | { ok: false; error: string };

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided" };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Unsupported image type" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadPublicFile(buffer, file.type, "covers");
    return { ok: true, url };
  } catch (error) {
    logger.error("image-upload-failed", { error: String(error) });
    return { ok: false, error: "Upload failed" };
  }
}

async function requireAdmin() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) {
    throw new Error("Unauthorized");
  }
}

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

function revalidateContentPaths() {
  for (const path of ["/", "/blog", "/projects", "/experience", "/admin", "/sitemap.xml", "/rss.xml"]) {
    revalidatePath(path);
  }
}

function reindexInBackground(promise: Promise<unknown>, slug: string) {
  promise.catch((error) => {
    logger.error("content-reindex-failed", { slug, error: String(error) });
  });
}

export async function savePost(rawInput: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = postInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = parsed.data;
  const existing = input.id ? await getPostRow(input.id) : await getPostRow(input.slug);
  const { bodyHtml, bodyText } = input;

  const row = await upsertPost({
    id: input.id ?? existing?.id,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    bodyJson: input.bodyJson,
    bodyHtml,
    bodyText,
    tags: input.tags,
    coverImage: emptyToNull(input.coverImage),
    canonicalUrl: emptyToNull(input.canonicalUrl),
    status: input.status,
    featured: input.featured,
    publishedAt:
      input.status === "published" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
  });

  revalidateContentPaths();
  revalidatePath(`/blog/${row.slug}`);
  for (const tag of row.tags) {
    revalidatePath(`/tags/${tag}`);
  }

  if (row.status === "published") {
    reindexInBackground(
      reindexDocument({
        type: "blog",
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        body: bodyText,
        metadata: { tags: row.tags, publishedAt: row.publishedAt?.toISOString() },
      }),
      row.slug,
    );
  } else {
    reindexInBackground(removeDocumentFromIndex(row.slug), row.slug);
  }

  return { ok: true, id: row.id, slug: row.slug };
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireAdmin();

  const existing = await getPostRow(id);
  if (!existing) {
    return { ok: false, error: "Post not found" };
  }

  await deletePostRow(existing.id);
  revalidateContentPaths();
  revalidatePath(`/blog/${existing.slug}`);
  reindexInBackground(removeDocumentFromIndex(existing.slug), existing.slug);

  return { ok: true, id: existing.id, slug: existing.slug };
}

export async function saveProject(rawInput: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = projectInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = parsed.data;
  const existing = input.id ? await getProjectRow(input.id) : await getProjectRow(input.slug);
  const { bodyHtml, bodyText } = input;

  const row = await upsertProject({
    id: input.id ?? existing?.id,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    bodyJson: input.bodyJson,
    bodyHtml,
    bodyText,
    role: input.role,
    technologies: input.technologies,
    impact: input.impact,
    githubUrl: emptyToNull(input.githubUrl),
    liveUrl: emptyToNull(input.liveUrl),
    coverImage: emptyToNull(input.coverImage),
    status: input.status,
    featured: input.featured,
    publishedAt:
      input.status === "published" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
  });

  revalidateContentPaths();
  revalidatePath(`/projects/${row.slug}`);

  if (row.status === "published") {
    reindexInBackground(
      reindexDocument({
        type: "project",
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        body: bodyText,
        metadata: { technologies: row.technologies, role: row.role },
      }),
      row.slug,
    );
  } else {
    reindexInBackground(removeDocumentFromIndex(row.slug), row.slug);
  }

  return { ok: true, id: row.id, slug: row.slug };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();

  const existing = await getProjectRow(id);
  if (!existing) {
    return { ok: false, error: "Project not found" };
  }

  await deleteProjectRow(existing.id);
  revalidateContentPaths();
  revalidatePath(`/projects/${existing.slug}`);
  reindexInBackground(removeDocumentFromIndex(existing.slug), existing.slug);

  return { ok: true, id: existing.id, slug: existing.slug };
}

export async function saveExperience(rawInput: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = experienceInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = parsed.data;
  const existing = input.id ? await getExperienceRow(input.id) : await getExperienceRow(input.slug);
  const { bodyHtml, bodyText } = input;

  const row = await upsertExperience({
    id: input.id ?? existing?.id,
    slug: input.slug,
    title: input.title,
    company: input.company,
    location: input.location,
    summary: input.summary,
    bodyJson: input.bodyJson,
    bodyHtml,
    bodyText,
    technologies: input.technologies,
    featured: input.featured,
    startDate: new Date(input.startDate),
    endDate: input.endDate ? new Date(input.endDate) : null,
  });

  revalidateContentPaths();

  reindexInBackground(
    reindexDocument({
      type: "experience",
      slug: row.slug,
      title: `${row.title} at ${row.company}`,
      summary: row.summary,
      body: bodyText,
      metadata: { company: row.company, technologies: row.technologies },
    }),
    row.slug,
  );

  return { ok: true, id: row.id, slug: row.slug };
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  await requireAdmin();

  const existing = await getExperienceRow(id);
  if (!existing) {
    return { ok: false, error: "Experience entry not found" };
  }

  await deleteExperienceRow(existing.id);
  revalidateContentPaths();
  reindexInBackground(removeDocumentFromIndex(existing.slug), existing.slug);

  return { ok: true, id: existing.id, slug: existing.slug };
}
