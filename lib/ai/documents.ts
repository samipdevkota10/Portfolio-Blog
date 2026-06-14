import { getAllExperience, getAllPosts, getAllProjects, getProfileSource } from "@/lib/content/loader";

export type SourceDocument = {
  type: "blog" | "project" | "experience" | "profile";
  slug: string;
  title: string;
  summary: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export async function collectSourceDocuments(): Promise<SourceDocument[]> {
  const [posts, projects, experience, profile] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
    getAllExperience(),
    getProfileSource(),
  ]);

  return [
    ...posts.map((post) => ({
      type: "blog" as const,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      body: post.contentText,
      metadata: {
        tags: post.tags,
        publishedAt: post.publishedAt,
      },
    })),
    ...projects.map((project) => ({
      type: "project" as const,
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      body: project.contentText,
      metadata: {
        technologies: project.technologies,
        role: project.role,
      },
    })),
    ...experience.map((item) => ({
      type: "experience" as const,
      slug: item.slug,
      title: `${item.title} at ${item.company}`,
      summary: item.summary,
      body: item.contentText,
      metadata: {
        company: item.company,
        technologies: item.technologies,
      },
    })),
    {
      type: "profile" as const,
      slug: "resume-profile",
      title: "Resume Profile",
      summary: "Canonical profile facts used to ground the assistant.",
      body: profile,
    },
  ];
}

export function chunkDocument(body: string, chunkSize = 180, overlap = 30) {
  const words = body.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += chunkSize - overlap) {
    chunks.push(words.slice(index, index + chunkSize).join(" "));
  }

  return chunks;
}
