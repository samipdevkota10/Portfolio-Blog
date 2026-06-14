import Link from "next/link";

import type { BlogPost } from "@/lib/content/loader";
import { formatDate } from "@/lib/utils";

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-moss"
          >
            {tag}
          </Link>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        <p className="text-sm text-ink/50">
          {formatDate(post.publishedAt)} · {post.readingTime}
        </p>
        <h3 className="font-serif text-3xl tracking-tight text-ink">{post.title}</h3>
        <p className="text-base leading-7 text-ink/70">{post.summary}</p>
      </div>
      <Link href={`/blog/${post.slug}`} className="mt-8 inline-flex text-sm font-semibold text-ember">
        Read article
      </Link>
    </article>
  );
}
