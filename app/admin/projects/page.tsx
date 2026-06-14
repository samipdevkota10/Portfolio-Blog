import Link from "next/link";

import { AdminDenied } from "@/components/admin/admin-denied";
import { getAdminContext } from "@/lib/auth";
import { listProjectRows } from "@/lib/db/content-queries";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const admin = await getAdminContext();
  if (!admin.configured || !admin.isAdmin) {
    return <AdminDenied configured={admin.configured} />;
  }

  const projects = await listProjectRows({ includeDrafts: true });

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Content</p>
          <h1 className="mt-2 font-serif text-5xl tracking-tight text-ink">Projects</h1>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-linen"
        >
          New project
        </Link>
      </div>

      <div className="mt-10 space-y-3">
        {projects.length === 0 ? (
          <p className="text-ink/60">No projects yet.</p>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}/edit`}
              className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm transition hover:border-ember/40"
            >
              <div>
                <h2 className="font-medium text-ink">{project.title}</h2>
                <p className="mt-1 text-sm text-ink/60">
                  /projects/{project.slug} · updated {project.updatedAt.toISOString().slice(0, 10)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                  project.status === "published" ? "bg-moss/10 text-moss" : "bg-brass/10 text-brass"
                }`}
              >
                {project.status}
              </span>
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
