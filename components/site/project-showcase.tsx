"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ShowcaseProject = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  technologies: string[];
  impact: string[];
  githubUrl?: string;
  liveUrl?: string;
};

function TechChips({ technologies }: { technologies: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {technologies.map((technology) => (
        <span
          key={technology}
          className="rounded-full bg-brass/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brass"
        >
          {technology}
        </span>
      ))}
    </div>
  );
}

function ShowcaseCard({ project, onOpen }: { project: ShowcaseProject; onOpen: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -4, y: px * 6 });
  }

  return (
    <motion.article
      ref={cardRef}
      layoutId={`project-${project.slug}`}
      onClick={onOpen}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      whileHover={{ y: -6 }}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ transformPerspective: 900 }}
      className="cursor-pointer rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl"
    >
      <TechChips technologies={project.technologies} />
      <div className="mt-6 space-y-4">
        <p className="text-sm font-medium text-ink/50">{project.role}</p>
        <h3 className="font-serif text-3xl tracking-tight text-ink">{project.title}</h3>
        <p className="text-base leading-7 text-ink/70">{project.summary}</p>
      </div>
      <p className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-ember">
        Open case study <ArrowUpRight className="h-4 w-4" />
      </p>
    </motion.article>
  );
}

function ShowcaseOverlay({ project, onClose }: { project: ShowcaseProject; onClose: () => void }) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <motion.article
        layoutId={`project-${project.slug}`}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-black/10 bg-white p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close case study"
          className="absolute right-5 top-5 rounded-full p-2 text-ink/50 transition hover:bg-black/5 hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
        <TechChips technologies={project.technologies} />
        <div className="mt-6 space-y-4">
          <p className="text-sm font-medium text-ink/50">{project.role}</p>
          <h3 className="font-serif text-4xl tracking-tight text-ink">{project.title}</h3>
          <p className="text-base leading-7 text-ink/70">{project.summary}</p>
        </div>
        {project.impact.length ? (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/50">Impact</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
              {project.impact.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={`/projects/${project.slug}`}
            className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Read full case study
          </Link>
          {project.githubUrl ? (
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-ink/60">
              GitHub
            </a>
          ) : null}
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-ink/60">
              Live site
            </a>
          ) : null}
        </div>
      </motion.article>
    </div>
  );
}

export function ProjectShowcase({ projects }: { projects: ShowcaseProject[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const activeProject = projects.find((project) => project.slug === activeSlug) ?? null;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {projects.map((project) => (
          <ShowcaseCard key={project.slug} project={project} onOpen={() => setActiveSlug(project.slug)} />
        ))}
      </div>
      <AnimatePresence>
        {activeProject ? <ShowcaseOverlay project={activeProject} onClose={() => setActiveSlug(null)} /> : null}
      </AnimatePresence>
    </>
  );
}
