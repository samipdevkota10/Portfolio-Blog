import { AdminDenied } from "@/components/admin/admin-denied";
import { ProjectForm } from "@/components/admin/project-form";
import { getAdminContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const admin = await getAdminContext();
  if (!admin.configured || !admin.isAdmin) {
    return <AdminDenied configured={admin.configured} />;
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Content</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight text-ink">New project</h1>
      <div className="mt-10">
        <ProjectForm />
      </div>
    </section>
  );
}
