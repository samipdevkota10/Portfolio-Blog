import type { ExperienceEntry } from "@/lib/content/loader";
import { formatDate } from "@/lib/utils";

export function ExperienceTimeline({ items }: { items: ExperienceEntry[] }) {
  return (
    <div className="space-y-8">
      {items.map((item) => (
        <article key={item.slug} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h3 className="font-serif text-3xl tracking-tight text-ink">{item.title}</h3>
              <p className="text-base font-medium text-ink/70">{item.company}</p>
              <p className="text-base leading-7 text-ink/70">{item.summary}</p>
            </div>
            <div className="shrink-0 space-y-2 text-sm text-ink/50">
              <p>
                {item.period
                  ? item.period
                  : `${formatDate(item.startDate)} - ${item.endDate ? formatDate(item.endDate) : "Present"}`}
              </p>
              {item.location ? <p>{item.location}</p> : null}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {item.technologies.map((technology) => (
              <span key={technology} className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                {technology}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
