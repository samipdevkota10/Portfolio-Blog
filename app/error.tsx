"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">Error</p>
      <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">Something went wrong.</h1>
      <p className="mt-4 text-lg text-ink/70">
        An unexpected error occurred while loading this page. You can try again, or head back home.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-ink/80"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
