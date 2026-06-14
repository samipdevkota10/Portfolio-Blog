import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">404</p>
      <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">This page is missing.</h1>
      <p className="mt-4 text-lg text-ink/70">Try heading back to the home page or exploring the writing and project indexes.</p>
      <Link href="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
        Return home
      </Link>
    </section>
  );
}
