import type { MetadataRoute } from "next";

import { getAllPosts, getAllProjects, getTagCounts } from "@/lib/content/loader";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, tags] = await Promise.all([getAllPosts(), getAllProjects(), getTagCounts()]);

  const staticRoutes = ["/", "/blog", "/projects", "/experience", "/admin"].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: new Date(project.publishedAt),
    })),
    ...Object.keys(tags).map((tag) => ({
      url: absoluteUrl(`/tags/${tag}`),
      lastModified: new Date(),
    })),
  ];
}
