import Script from "next/script";

import { ExperienceTimeline } from "@/components/site/experience-timeline";
import { PostCard } from "@/components/site/post-card";
import { ProjectShowcase } from "@/components/site/project-showcase";
import { SectionHeading } from "@/components/site/section-heading";
import { personJsonLd } from "@/lib/jsonld";
import { getAllExperience, getAllPosts, getAllProjects } from "@/lib/content/loader";
import { toShowcaseProject } from "@/lib/content/showcase";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export default async function HomePage() {
  const [posts, projects, experience] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
    getAllExperience(),
  ]);

  const recentPosts = posts.slice(0, 3);

  return (
    <>
      <Script
        id="person-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
      />
      <section data-chat-section="hero" className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="space-y-6">
          <h1 className="max-w-4xl font-serif text-6xl font-semibold leading-[0.95] tracking-tight text-ink md:text-7xl">
            Hi, I&apos;m {siteConfig.name}
          </h1>
          <h2 className="text-2xl font-semibold text-ink md:text-3xl">
            I like to build things.
          </h2>
          <p className="max-w-3xl text-lg leading-8 text-ink/70">
            Software engineer who likes shipping real things &mdash; not slide decks. This site is a peek at
            what I&apos;ve built, what I&apos;ve learned, and what I&apos;m thinking about. Poke around the projects,
            read the blog, or just ask the AI chatbot &mdash; it knows everything here and follows along as you scroll.
          </p>
        </div>
      </section>

      <section data-chat-section="writing" className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <SectionHeading
          title="Recent Blogs"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section
        id="experience"
        data-chat-section="experience"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 lg:px-8"
      >
        <SectionHeading
          title="Experience"
        />
        <div className="mt-10">
          <ExperienceTimeline items={experience} />
        </div>
      </section>

      <section
        id="projects"
        data-chat-section="projects"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 lg:px-8"
      >
        <SectionHeading
          title="Projects"
        />
        <div className="mt-10">
          <ProjectShowcase projects={projects.map(toShowcaseProject)} />
        </div>
      </section>

    </>
  );
}
