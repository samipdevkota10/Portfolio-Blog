import Link from "next/link";

import { AdminDenied } from "@/components/admin/admin-denied";
import { getAdminContext } from "@/lib/auth";
import { listExperienceRows } from "@/lib/db/content-queries";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const admin = await getAdminContext();
  if (!admin.configured || !admin.isAdmin) {
    return <AdminDenied configured={admin.configured} />;
  }

  const entries = await listExperienceRows();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Content</p>
          <h1 className="mt-2 font-serif text-5xl tracking-tight text-ink">Experience</h1>
        </div>
        <Link
          href="/admin/experience/new"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-linen"
        >
          New entry
        </Link>
      </div>

      <div className="mt-10 space-y-3">
        {entries.length === 0 ? (
          <p className="text-ink/60">No experience entries yet.</p>
        ) : (
          entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/admin/experience/${entry.id}/edit`}
              className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm transition hover:border-ember/40"
            >
              <div>
                <h2 className="font-medium text-ink">
                  {entry.title} · {entry.company}
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                  {entry.startDate.toISOString().slice(0, 10)} –{" "}
                  {entry.endDate ? entry.endDate.toISOString().slice(0, 10) : "present"}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link href="/admin" className="mt-10 inline-block text-sm font-semibold text-ember">
        ← Back to dashboard
      </Link>
    </section>
  );
}
