import { notFound } from "next/navigation";

import { AdminDenied } from "@/components/admin/admin-denied";
import { ProjectForm } from "@/components/admin/project-form";
import { getAdminContext } from "@/lib/auth";
import { getProjectRow } from "@/lib/db/content-queries";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminContext();
  if (!admin.configured || !admin.isAdmin) {
    return <AdminDenied configured={admin.configured} />;
  }

  const { id } = await params;
  const project = await getProjectRow(id);
  if (!project) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Content</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight text-ink">Edit project</h1>
      <div className="mt-10">
        <ProjectForm
          initial={{
            id: project.id,
            slug: project.slug,
            title: project.title,
            summary: project.summary,
            bodyJson: project.bodyJson,
            role: project.role,
            technologies: project.technologies,
            impact: project.impact,
            githubUrl: project.githubUrl ?? undefined,
            liveUrl: project.liveUrl ?? undefined,
            coverImage: project.coverImage ?? undefined,
            status: project.status,
            featured: project.featured,
          }}
        />
      </div>
    </section>
  );
}
