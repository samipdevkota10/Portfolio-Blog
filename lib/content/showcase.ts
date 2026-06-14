import type { ShowcaseProject } from "@/components/site/project-showcase";
import type { ProjectEntry } from "@/lib/content/loader";

export function toShowcaseProject(project: ProjectEntry): ShowcaseProject {
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    role: project.role,
    technologies: project.technologies,
    impact: project.impact,
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
  };
}
