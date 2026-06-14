import { getAllPosts } from "@/lib/content/loader";
import { absoluteUrl } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export async function GET() {
  const posts = await getAllPosts();

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>${siteConfig.name}</title>
      <description>${siteConfig.description}</description>
      <link>${siteConfig.url}</link>
      ${posts
        .map(
          (post) => `
        <item>
          <title>${post.title}</title>
          <description>${post.summary}</description>
          <link>${absoluteUrl(`/blog/${post.slug}`)}</link>
          <guid>${absoluteUrl(`/blog/${post.slug}`)}</guid>
          <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        </item>`,
        )
        .join("")}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
