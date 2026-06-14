import { notFound } from "next/navigation";

import { AdminDenied } from "@/components/admin/admin-denied";
import { PostForm } from "@/components/admin/post-form";
import { getAdminContext } from "@/lib/auth";
import { getPostRow } from "@/lib/db/content-queries";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminContext();
  if (!admin.configured || !admin.isAdmin) {
    return <AdminDenied configured={admin.configured} />;
  }

  const { id } = await params;
  const post = await getPostRow(id);
  if (!post) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Content</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight text-ink">Edit post</h1>
      <div className="mt-10">
        <PostForm
          initial={{
            id: post.id,
            slug: post.slug,
            title: post.title,
            summary: post.summary,
            bodyJson: post.bodyJson,
            tags: post.tags,
            coverImage: post.coverImage ?? undefined,
            canonicalUrl: post.canonicalUrl ?? undefined,
            status: post.status,
            featured: post.featured,
          }}
        />
      </div>
    </section>
  );
}
