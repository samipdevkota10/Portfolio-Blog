import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl space-y-3", className)}>
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember">{eyebrow}</p> : null}
      <h2 className="font-serif text-4xl font-semibold tracking-tight text-ink md:text-5xl">{title}</h2>
      {description ? <p className="text-lg leading-8 text-ink/70">{description}</p> : null}
    </div>
  );
}
