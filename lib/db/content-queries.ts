import "server-only";

import { Timestamp, type Firestore } from "firebase-admin/firestore";

import { firestore } from "@/lib/firebase/admin";
import type { RichTextDoc } from "@/lib/content/richtext";

export type ContentStatus = "draft" | "published";

const POSTS_COLLECTION = "Blogs";
const PROJECTS_COLLECTION = "projects";
const EXPERIENCE_COLLECTION = "Experiences";

function requireDb(): Firestore {
  if (!firestore) {
    throw new Error(
      "Firebase is not configured. Site content now lives in Firestore — set FIREBASE_SERVICE_ACCOUNT.",
    );
  }
  return firestore;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyJson: Record<string, unknown>;
  bodyHtml: string;
  bodyText: string;
  tags: string[];
  coverImage: string | null;
  canonicalUrl: string | null;
  status: ContentStatus;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyJson: Record<string, unknown>;
  bodyHtml: string;
  bodyText: string;
  role: string;
  technologies: string[];
  impact: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  coverImage: string | null;
  status: ContentStatus;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExperienceRow = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  bodyJson: Record<string, unknown>;
  bodyHtml: string;
  bodyText: string;
  technologies: string[];
  featured: boolean;
  period: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PostInput = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  bodyJson: RichTextDoc;
  bodyHtml: string;
  bodyText: string;
  tags: string[];
  coverImage?: string | null;
  canonicalUrl?: string | null;
  status: ContentStatus;
  featured: boolean;
  publishedAt?: Date | null;
};

export type ProjectInput = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  bodyJson: RichTextDoc;
  bodyHtml: string;
  bodyText: string;
  role: string;
  technologies: string[];
  impact: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  coverImage?: string | null;
  status: ContentStatus;
  featured: boolean;
  publishedAt?: Date | null;
};

export type ExperienceInput = {
  id?: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  bodyJson: RichTextDoc;
  bodyHtml: string;
  bodyText: string;
  technologies: string[];
  featured: boolean;
  startDate: Date;
  endDate?: Date | null;
};

function mapPostDoc(id: string, data: FirebaseFirestore.DocumentData): PostRow {
  return {
    id,
    slug: String(data.slug ?? id),
    title: String(data.title ?? "Untitled"),
    summary: String(data.summary ?? ""),
    bodyJson: (data.bodyJson as Record<string, unknown>) ?? {},
    bodyHtml: String(data.bodyHtml ?? data.content ?? ""),
    bodyText: String(data.bodyText ?? data.contentText ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    coverImage: data.coverImage ?? data.imageUrl ?? null,
    canonicalUrl: data.canonicalUrl ?? null,
    status: (data.status as ContentStatus) ?? "published",
    featured: Boolean(data.featured),
    publishedAt: toDate(data.publishedAt) ?? toDate(data.createdAt),
    createdAt: toDate(data.createdAt) ?? new Date(0),
    updatedAt: toDate(data.updatedAt) ?? new Date(0),
  };
}

function mapProjectDoc(id: string, data: FirebaseFirestore.DocumentData): ProjectRow {
  return {
    id,
    slug: String(data.slug ?? id),
    title: String(data.title ?? "Untitled"),
    summary: String(data.summary ?? ""),
    bodyJson: (data.bodyJson as Record<string, unknown>) ?? {},
    bodyHtml: String(data.bodyHtml ?? ""),
    bodyText: String(data.bodyText ?? ""),
    role: String(data.role ?? ""),
    technologies: Array.isArray(data.technologies) ? data.technologies.map(String) : [],
    impact: Array.isArray(data.impact) ? data.impact.map(String) : [],
    githubUrl: data.githubUrl ?? null,
    liveUrl: data.liveUrl ?? null,
    coverImage: data.coverImage ?? null,
    status: (data.status as ContentStatus) ?? "published",
    featured: Boolean(data.featured),
    publishedAt: toDate(data.publishedAt) ?? toDate(data.createdAt),
    createdAt: toDate(data.createdAt) ?? new Date(0),
    updatedAt: toDate(data.updatedAt) ?? new Date(0),
  };
}

function mapExperienceDoc(id: string, data: FirebaseFirestore.DocumentData): ExperienceRow {
  return {
    id,
    slug: String(data.slug ?? id),
    title: String(data.title ?? "Untitled"),
    company: String(data.company ?? ""),
    location: String(data.location ?? ""),
    summary: String(data.summary ?? ""),
    bodyJson: (data.bodyJson as Record<string, unknown>) ?? {},
    bodyHtml: String(data.bodyHtml ?? ""),
    bodyText: String(data.bodyText ?? ""),
    technologies: Array.isArray(data.technologies) ? data.technologies.map(String) : [],
    featured: Boolean(data.featured),
    period: String(data.period ?? data.year ?? ""),
    startDate: toDate(data.startDate) ?? new Date(0),
    endDate: toDate(data.endDate),
    createdAt: toDate(data.createdAt) ?? new Date(0),
    updatedAt: toDate(data.updatedAt) ?? new Date(0),
  };
}

async function findBySlug(collection: string, slug: string) {
  const db = requireDb();
  const snapshot = await db.collection(collection).where("slug", "==", slug).limit(1).get();
  return snapshot.docs[0] ?? null;
}

// --- Posts ---

export async function listPostRows({ includeDrafts = false } = {}): Promise<PostRow[]> {
  if (!firestore) return [];
  const db = requireDb();
  const snapshot = await db.collection(POSTS_COLLECTION).get();
  const rows = snapshot.docs.map((doc) => mapPostDoc(doc.id, doc.data()));
  return rows
    .filter((row) => includeDrafts || row.status === "published")
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
}

export async function getPostRow(idOrSlug: string): Promise<PostRow | null> {
  if (!firestore) return null;
  const db = requireDb();
  const bySlug = await findBySlug(POSTS_COLLECTION, idOrSlug);
  if (bySlug) return mapPostDoc(bySlug.id, bySlug.data());
  const byId = await db.collection(POSTS_COLLECTION).doc(idOrSlug).get();
  return byId.exists ? mapPostDoc(byId.id, byId.data() as FirebaseFirestore.DocumentData) : null;
}

export async function upsertPost(input: PostInput): Promise<PostRow> {
  const db = requireDb();
  const now = new Date();
  const values = {
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    bodyJson: input.bodyJson as Record<string, unknown>,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    contentText: input.bodyText,
    tags: input.tags,
    coverImage: input.coverImage ?? null,
    canonicalUrl: input.canonicalUrl ?? null,
    status: input.status,
    featured: input.featured,
    publishedAt: input.publishedAt ?? null,
    updatedAt: now,
  };

  const existing = input.id
    ? db.collection(POSTS_COLLECTION).doc(input.id)
    : (await findBySlug(POSTS_COLLECTION, input.slug))?.ref ?? db.collection(POSTS_COLLECTION).doc();

  const snapshot = await existing.get();
  if (snapshot.exists) {
    await existing.set(values, { merge: true });
  } else {
    await existing.set({ ...values, createdAt: now });
  }

  const saved = await existing.get();
  return mapPostDoc(saved.id, saved.data() as FirebaseFirestore.DocumentData);
}

export async function deletePostRow(id: string) {
  const db = requireDb();
  await db.collection(POSTS_COLLECTION).doc(id).delete();
}

// --- Projects ---

export async function listProjectRows({ includeDrafts = false } = {}): Promise<ProjectRow[]> {
  if (!firestore) return [];
  const db = requireDb();
  const snapshot = await db.collection(PROJECTS_COLLECTION).get();
  const rows = snapshot.docs.map((doc) => mapProjectDoc(doc.id, doc.data()));
  return rows
    .filter((row) => row.title.trim() && row.title !== "Untitled")
    .filter((row) => includeDrafts || row.status === "published")
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
}

export async function getProjectRow(idOrSlug: string): Promise<ProjectRow | null> {
  if (!firestore) return null;
  const db = requireDb();
  const bySlug = await findBySlug(PROJECTS_COLLECTION, idOrSlug);
  if (bySlug) return mapProjectDoc(bySlug.id, bySlug.data());
  const byId = await db.collection(PROJECTS_COLLECTION).doc(idOrSlug).get();
  return byId.exists ? mapProjectDoc(byId.id, byId.data() as FirebaseFirestore.DocumentData) : null;
}

export async function upsertProject(input: ProjectInput): Promise<ProjectRow> {
  const db = requireDb();
  const now = new Date();
  const values = {
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    bodyJson: input.bodyJson as Record<string, unknown>,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    role: input.role,
    technologies: input.technologies,
    impact: input.impact,
    githubUrl: input.githubUrl ?? null,
    liveUrl: input.liveUrl ?? null,
    coverImage: input.coverImage ?? null,
    status: input.status,
    featured: input.featured,
    publishedAt: input.publishedAt ?? null,
    updatedAt: now,
  };

  const ref = input.id
    ? db.collection(PROJECTS_COLLECTION).doc(input.id)
    : (await findBySlug(PROJECTS_COLLECTION, input.slug))?.ref ?? db.collection(PROJECTS_COLLECTION).doc();

  const snapshot = await ref.get();
  if (snapshot.exists) {
    await ref.set(values, { merge: true });
  } else {
    await ref.set({ ...values, createdAt: now });
  }

  const saved = await ref.get();
  return mapProjectDoc(saved.id, saved.data() as FirebaseFirestore.DocumentData);
}

export async function deleteProjectRow(id: string) {
  const db = requireDb();
  await db.collection(PROJECTS_COLLECTION).doc(id).delete();
}

// --- Experience ---

export async function listExperienceRows({ includeDrafts = false } = {}): Promise<ExperienceRow[]> {
  if (!firestore) return [];
  void includeDrafts;
  const db = requireDb();
  const snapshot = await db.collection(EXPERIENCE_COLLECTION).get();
  return snapshot.docs
    .map((doc) => mapExperienceDoc(doc.id, doc.data()))
    .filter((row) => row.title.trim() && row.title !== "Untitled")
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

export async function getExperienceRow(idOrSlug: string): Promise<ExperienceRow | null> {
  if (!firestore) return null;
  const db = requireDb();
  const bySlug = await findBySlug(EXPERIENCE_COLLECTION, idOrSlug);
  if (bySlug) return mapExperienceDoc(bySlug.id, bySlug.data());
  const byId = await db.collection(EXPERIENCE_COLLECTION).doc(idOrSlug).get();
  return byId.exists ? mapExperienceDoc(byId.id, byId.data() as FirebaseFirestore.DocumentData) : null;
}

export async function upsertExperience(input: ExperienceInput): Promise<ExperienceRow> {
  const db = requireDb();
  const now = new Date();
  const values = {
    slug: input.slug,
    title: input.title,
    company: input.company,
    location: input.location,
    summary: input.summary,
    bodyJson: input.bodyJson as Record<string, unknown>,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    technologies: input.technologies,
    featured: input.featured,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    updatedAt: now,
  };

  const ref = input.id
    ? db.collection(EXPERIENCE_COLLECTION).doc(input.id)
    : (await findBySlug(EXPERIENCE_COLLECTION, input.slug))?.ref ?? db.collection(EXPERIENCE_COLLECTION).doc();

  const snapshot = await ref.get();
  if (snapshot.exists) {
    await ref.set(values, { merge: true });
  } else {
    await ref.set({ ...values, createdAt: now });
  }

  const saved = await ref.get();
  return mapExperienceDoc(saved.id, saved.data() as FirebaseFirestore.DocumentData);
}

export async function deleteExperienceRow(id: string) {
  const db = requireDb();
  await db.collection(EXPERIENCE_COLLECTION).doc(id).delete();
}
