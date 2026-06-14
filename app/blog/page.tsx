import type { Metadata } from "next";

import { PostCard } from "@/components/site/post-card";
import { SectionHeading } from "@/components/site/section-heading";
import { getAllPosts } from "@/lib/content/loader";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes on grounded AI, system design, and product engineering.",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <section data-chat-section="writing" className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
      <SectionHeading
        eyebrow="Writing"
        title="Essays, architecture notes, and working docs."
        description="Notes and essays, all available as source material for the site assistant."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
