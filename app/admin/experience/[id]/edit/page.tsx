import { notFound } from "next/navigation";

import { AdminDenied } from "@/components/admin/admin-denied";
import { ExperienceForm } from "@/components/admin/experience-form";
import { getAdminContext } from "@/lib/auth";
import { getExperienceRow } from "@/lib/db/content-queries";

export const dynamic = "force-dynamic";

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminContext();
  if (!admin.configured || !admin.isAdmin) {
    return <AdminDenied configured={admin.configured} />;
  }

  const { id } = await params;
  const entry = await getExperienceRow(id);
  if (!entry) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Content</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight text-ink">Edit experience entry</h1>
      <div className="mt-10">
        <ExperienceForm
          initial={{
            id: entry.id,
            slug: entry.slug,
            title: entry.title,
            company: entry.company,
            location: entry.location,
            summary: entry.summary,
            bodyJson: entry.bodyJson,
            technologies: entry.technologies,
            featured: entry.featured,
            startDate: entry.startDate.toISOString().slice(0, 10),
            endDate: entry.endDate ? entry.endDate.toISOString().slice(0, 10) : undefined,
          }}
        />
      </div>
    </section>
  );
}
