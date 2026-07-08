import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { notFound } from "next/navigation";

import { CommentsPanel } from "@/components/site/comments";
import { articleJsonLd } from "@/lib/jsonld";
import { getPostBySlug } from "@/lib/content/loader";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Script
        id={`article-jsonld-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              title: post.title,
              description: post.summary,
              publishedAt: post.publishedAt,
              slug: post.slug,
            }),
          ),
        }}
      />
      <article data-chat-section="writing" className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        {post.coverImage ? (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl border border-black/5 bg-black/5">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 1024px) 56rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-moss">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-ink md:text-6xl">{post.title}</h1>
          <p className="text-lg leading-8 text-ink/70">{post.summary}</p>
          <p className="text-sm uppercase tracking-[0.2em] text-ink/50">
            {formatDate(post.publishedAt)} · {post.readingTime}
          </p>
        </div>
        <div
          className="prose prose-lg mt-12 max-w-none prose-headings:font-serif prose-headings:text-ink prose-p:text-ink/80 prose-li:text-ink/80 prose-strong:text-ink prose-a:text-ember prose-a:decoration-ember/40 hover:prose-a:decoration-ember prose-blockquote:border-l-ember/50 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-ink/70 prose-code:text-moss prose-pre:bg-ink prose-pre:text-linen prose-img:rounded-2xl prose-hr:border-black/10"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      <div className="mx-auto max-w-4xl px-6 pb-16 lg:px-8">
        <CommentsPanel slug={post.slug} />
      </div>
    </>
  );
}
