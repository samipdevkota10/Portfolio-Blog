import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";

import { projectJsonLd } from "@/lib/jsonld";
import { getProjectBySlug } from "@/lib/content/loader";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {};
  }

  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <Script
        id={`project-jsonld-${project.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            projectJsonLd({
              title: project.title,
              description: project.summary,
              slug: project.slug,
            }),
          ),
        }}
      />
      <section data-chat-section="projects" className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">{project.role}</p>
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-ink md:text-6xl">{project.title}</h1>
          <p className="text-lg leading-8 text-ink/70">{project.summary}</p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <span key={technology} className="rounded-full bg-brass/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brass">
                {technology}
              </span>
            ))}
          </div>
        </div>
        <div
          className="prose prose-lg mt-12 max-w-none prose-headings:font-serif prose-headings:text-ink prose-p:text-ink/80 prose-li:text-ink/80 prose-strong:text-ink prose-a:text-ember prose-a:decoration-ember/40 hover:prose-a:decoration-ember prose-blockquote:border-l-ember/50 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-ink/70 prose-code:text-moss prose-pre:bg-ink prose-pre:text-linen prose-img:rounded-2xl prose-hr:border-black/10"
          dangerouslySetInnerHTML={{ __html: project.content }}
        />
      </section>
    </>
  );
}
