import Link from "next/link";

import { ReindexButton } from "@/components/admin/reindex-button";
import { adminOverview, listPendingComments, listRecentContactSubmissions } from "@/lib/db/queries";
import { getAdminContext } from "@/lib/auth";
import { updateCommentStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminContext();

  if (!admin.configured) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <h1 className="font-serif text-5xl tracking-tight text-ink">Admin</h1>
        <p className="mt-4 text-lg text-ink/70">
          Clerk is not configured yet. Add Clerk keys to enable protected admin operations.
        </p>
      </section>
    );
  }

  if (!admin.isAdmin) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <h1 className="font-serif text-5xl tracking-tight text-ink">Admin</h1>
        <p className="mt-4 text-lg text-ink/70">You must sign in with an allowed admin email to view this area.</p>
        {admin.email ? (
          <p className="mt-2 text-sm text-ink/50">
            You are signed in as <span className="font-medium text-ink/70">{admin.email}</span>. Add this address to the{" "}
            <code className="rounded bg-black/5 px-1">ADMIN_EMAILS</code> environment variable to grant access.
          </p>
        ) : null}
      </section>
    );
  }

  const [overview, pendingComments, recentContacts] = await Promise.all([
    adminOverview(),
    listPendingComments(),
    listRecentContactSubmissions(),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Operations</p>
        <h1 className="font-serif text-5xl tracking-tight text-ink">Admin dashboard</h1>
        <p className="max-w-3xl text-lg text-ink/70">
          Moderate public comments, inspect inbound contact submissions, and refresh the AI corpus from the typed content sources.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {Object.entries(overview).map(([label, value]) => (
          <article key={label} className="rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-ink/50">{label}</p>
            <p className="mt-3 font-serif text-4xl text-ink">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {([
          { href: "/admin/posts", title: "Blog posts", description: "Write, edit, and publish posts." },
          { href: "/admin/projects", title: "Projects", description: "Manage project case studies." },
          { href: "/admin/experience", title: "Experience", description: "Update your work history." },
        ] as const).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-sm transition hover:border-ember/40"
          >
            <h2 className="font-serif text-2xl tracking-tight text-ink">{item.title}</h2>
            <p className="mt-2 text-sm text-ink/60">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-3xl tracking-tight text-ink">AI corpus</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink/70">
          Re-index blog posts, projects, experience entries, and the canonical profile document into the retrieval corpus.
        </p>
        <div className="mt-6">
          <ReindexButton />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl tracking-tight text-ink">Pending comments</h2>
          <div className="mt-6 space-y-4">
            {pendingComments.length === 0 ? (
              <p className="text-sm text-ink/60">No comments waiting for moderation.</p>
            ) : (
              pendingComments.map((comment) => (
                <article key={comment.id} className="rounded-[1.5rem] border border-black/5 bg-linen p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/50">{comment.slug}</p>
                      <h3 className="mt-1 font-medium text-ink">{comment.author}</h3>
                    </div>
                    <div className="flex gap-2">
                      <form action={updateCommentStatus}>
                        <input type="hidden" name="id" value={comment.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white">Approve</button>
                      </form>
                      <form action={updateCommentStatus}>
                        <input type="hidden" name="id" value={comment.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white">Reject</button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink/80">{comment.body}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl tracking-tight text-ink">Recent contact submissions</h2>
          <div className="mt-6 space-y-4">
            {recentContacts.length === 0 ? (
              <p className="text-sm text-ink/60">No submissions stored yet.</p>
            ) : (
              recentContacts.map((submission) => (
                <article key={submission.id} className="rounded-[1.5rem] border border-black/5 bg-linen p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">{submission.name}</p>
                      <p className="text-sm text-ink/60">{submission.email}</p>
                    </div>
                    <p className="text-sm uppercase tracking-[0.2em] text-ink/50">{submission.status}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{submission.subject}</p>
                  <p className="mt-3 text-sm leading-7 text-ink/80">{submission.message}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
