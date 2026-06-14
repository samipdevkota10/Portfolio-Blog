import { notFound } from "next/navigation";

import { PostCard } from "@/components/site/post-card";
import { SectionHeading } from "@/components/site/section-heading";
import { getAllPosts } from "@/lib/content/loader";

export const revalidate = 300;

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts = (await getAllPosts()).filter((post) => post.tags.includes(tag));

  if (posts.length === 0) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
      <SectionHeading
        eyebrow="Tagged"
        title={`Posts about ${tag}`}
        description="A filtered view of the writing index."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
