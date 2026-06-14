import { describe, expect, it, vi } from "vitest";

const now = new Date("2026-01-15T00:00:00Z");

const postRow = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "sample-post",
  title: "Sample Post",
  summary: "A sample post.",
  bodyJson: { type: "doc", content: [] },
  bodyHtml: "<p>Hello world</p>",
  bodyText: "Hello world",
  tags: ["ai", "backend"],
  coverImage: null,
  canonicalUrl: null,
  status: "published",
  featured: true,
  publishedAt: now,
  createdAt: now,
  updatedAt: now,
};

const projectRow = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "sample-project",
  title: "Sample Project",
  summary: "A sample project.",
  bodyJson: { type: "doc", content: [] },
  bodyHtml: "<p>Project body</p>",
  bodyText: "Project body",
  role: "Engineer",
  technologies: ["TypeScript", "Postgres"],
  impact: ["Shipped it"],
  githubUrl: null,
  liveUrl: null,
  coverImage: null,
  status: "published",
  featured: false,
  publishedAt: now,
  createdAt: now,
  updatedAt: now,
};

vi.mock("@/lib/db/content-queries", () => ({
  listPostRows: vi.fn(async () => [postRow]),
  getPostRow: vi.fn(async (slug: string) => (slug === postRow.slug ? postRow : null)),
  listProjectRows: vi.fn(async () => [projectRow]),
  getProjectRow: vi.fn(async (slug: string) => (slug === projectRow.slug ? projectRow : null)),
  listExperienceRows: vi.fn(async () => []),
  getExperienceRow: vi.fn(async () => null),
}));

import { getAllPosts, getAllProjects, getPostBySlug, getTagCounts } from "@/lib/content/loader";

describe("content loader", () => {
  it("maps post rows to posts with derived fields", async () => {
    const posts = await getAllPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      slug: "sample-post",
      title: "Sample Post",
      tags: ["ai", "backend"],
      publishedAt: "2026-01-15",
      draft: false,
      content: "<p>Hello world</p>",
      contentText: "Hello world",
      readingTime: expect.any(String),
      collection: "blog",
    });
  });

  it("maps project rows with typed metadata", async () => {
    const projects = await getAllProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0].technologies).toEqual(["TypeScript", "Postgres"]);
    expect(projects[0].impact).toEqual(["Shipped it"]);
    expect(projects[0].githubUrl).toBeUndefined();
  });

  it("returns null for unknown post slugs", async () => {
    expect(await getPostBySlug("missing")).toBeNull();
  });

  it("aggregates tag counts from published posts", async () => {
    expect(await getTagCounts()).toEqual({ ai: 1, backend: 1 });
  });
});
