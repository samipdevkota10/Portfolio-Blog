import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#141414] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="space-y-2">
          <p className="font-serif text-2xl">{siteConfig.name}</p>
          <p className="max-w-xl text-sm text-white/70">
            Server-first portfolio platform with MDX content, operational data, and a grounded AI assistant.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-white/70">
          <a href={siteConfig.socialLinks.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={siteConfig.socialLinks.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href="/rss.xml">RSS</a>
          <a href="/sitemap.xml">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}
