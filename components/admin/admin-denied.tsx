export function AdminDenied({ configured }: { configured: boolean }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <h1 className="font-serif text-5xl tracking-tight text-ink">Admin</h1>
      <p className="mt-4 text-lg text-ink/70">
        {configured
          ? "You must sign in with an allowed admin email to view this area."
          : "Clerk is not configured yet. Add Clerk keys to enable protected admin operations."}
      </p>
    </section>
  );
}
