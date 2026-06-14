import fs from "node:fs/promises";
import path from "node:path";
import readingTime from "reading-time";
import { cache } from "react";

import {
  getExperienceRow,
  getPostRow,
  getProjectRow,
  listExperienceRows,
  listPostRows,
  listProjectRows,
  type ExperienceRow,
  type PostRow,
  type ProjectRow,
} from "@/lib/db/content-queries";

const contentRoot = path.join(process.cwd(), "content");

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  coverImage?: string;
  draft: boolean;
  featured: boolean;
  canonicalUrl?: string;
  tags: string[];
  content: string; // rendered HTML
  contentText: string; // plain text (search, RAG)
  readingTime: string;
  collection: "blog";
};

export type ProjectEntry = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  coverImage?: string;
  draft: boolean;
  featured: boolean;
  role: string;
  technologies: string[];
  impact: string[];
  githubUrl?: string;
  liveUrl?: string;
  content: string;
  contentText: string;
  readingTime: string;
  collection: "projects";
};

export type ExperienceEntry = {
  id: string;
  title: string;
  slug: string;
  company: string;
  startDate: string;
  endDate?: string;
  location: string;
  summary: string;
  technologies: string[];
  featured: boolean;
  period: string;
  content: string;
  contentText: string;
  collection: "experience";
};

function toDateString(value: Date | null): string {
  return (value ?? new Date(0)).toISOString().slice(0, 10);
}

function mapPost(row: PostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    publishedAt: toDateString(row.publishedAt ?? row.createdAt),
    coverImage: row.coverImage ?? undefined,
    draft: row.status !== "published",
    featured: row.featured,
    canonicalUrl: row.canonicalUrl ?? undefined,
    tags: row.tags,
    content: row.bodyHtml,
    contentText: row.bodyText,
    readingTime: readingTime(row.bodyText).text,
    collection: "blog",
  };
}

function mapProject(row: ProjectRow): ProjectEntry {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    publishedAt: toDateString(row.publishedAt ?? row.createdAt),
    coverImage: row.coverImage ?? undefined,
    draft: row.status !== "published",
    featured: row.featured,
    role: row.role,
    technologies: row.technologies,
    impact: row.impact,
    githubUrl: row.githubUrl ?? undefined,
    liveUrl: row.liveUrl ?? undefined,
    content: row.bodyHtml,
    contentText: row.bodyText,
    readingTime: readingTime(row.bodyText).text,
    collection: "projects",
  };
}

function mapExperience(row: ExperienceRow): ExperienceEntry {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    company: row.company,
    startDate: toDateString(row.startDate),
    endDate: row.endDate ? toDateString(row.endDate) : undefined,
    location: row.location,
    summary: row.summary,
    technologies: row.technologies,
    featured: row.featured,
    period: row.period,
    content: row.bodyHtml,
    contentText: row.bodyText,
    collection: "experience",
  };
}

export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  const rows = await listPostRows();
  return rows.map(mapPost);
});

export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const row = await getPostRow(slug);
  if (!row || row.status !== "published") return null;
  return mapPost(row);
});

export const getAllProjects = cache(async (): Promise<ProjectEntry[]> => {
  const rows = await listProjectRows();
  return rows.map(mapProject);
});

export const getProjectBySlug = cache(async (slug: string): Promise<ProjectEntry | null> => {
  const row = await getProjectRow(slug);
  if (!row || row.status !== "published") return null;
  return mapProject(row);
});

export const getAllExperience = cache(async (): Promise<ExperienceEntry[]> => {
  const rows = await listExperienceRows();
  return rows.map(mapExperience);
});

export const getExperienceBySlug = cache(async (slug: string): Promise<ExperienceEntry | null> => {
  const row = await getExperienceRow(slug);
  return row ? mapExperience(row) : null;
});

export const getProfileSource = cache(async () => {
  return fs.readFile(path.join(contentRoot, "profile", "resume.md"), "utf8");
});

export async function getTagCounts() {
  const posts = await getAllPosts();

  return posts.reduce<Record<string, number>>((acc, post) => {
    for (const tag of post.tags) {
      acc[tag] = (acc[tag] ?? 0) + 1;
    }

    return acc;
  }, {});
}
