"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/core";

import { saveExperience, deleteExperience, type ActionResult } from "@/app/admin/content-actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Field, inputClass, slugify, splitList } from "@/components/admin/form-fields";

export type ExperienceFormData = {
  id?: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  bodyJson: JSONContent;
  technologies: string[];
  featured: boolean;
  startDate: string;
  endDate?: string;
};

export function ExperienceForm({ initial }: { initial?: ExperienceFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [company, setCompany] = useState(initial?.company ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [technologies, setTechnologies] = useState(initial?.technologies.join(", ") ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [bodyJson, setBodyJson] = useState<JSONContent>(
    initial?.bodyJson ?? { type: "doc", content: [{ type: "paragraph" }] },
  );
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");

  function submit() {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await saveExperience({
        id: initial?.id,
        slug,
        title,
        company,
        location,
        summary,
        bodyJson: JSON.stringify(bodyJson),
        bodyHtml,
        bodyText,
        technologies: splitList(technologies),
        featured,
        startDate,
        endDate,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/experience");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm("Delete this experience entry permanently?")) return;
    startTransition(async () => {
      const result = await deleteExperience(initial.id!);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/experience");
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Role / title">
          <input
            className={inputClass}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            placeholder="Software Engineer Intern"
            required
          />
        </Field>
        <Field label="Slug">
          <input
            className={inputClass}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="company-role"
            required
          />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Company">
          <input
            className={inputClass}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Company name"
            required
          />
        </Field>
        <Field label="Location">
          <input
            className={inputClass}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Remote / City, State"
            required
          />
        </Field>
      </div>

      <Field label="Summary">
        <textarea
          className={`${inputClass} min-h-[5rem]`}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="A sentence about what you did there."
          required
        />
      </Field>

      <Field label="Details">
        <RichTextEditor
          initialContent={initial?.bodyJson}
          onChange={(value) => {
            setBodyJson(value.json);
            setBodyHtml(value.html);
            setBodyText(value.text);
          }}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Start date">
          <input
            type="date"
            className={inputClass}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </Field>
        <Field label="End date (blank = present)">
          <input
            type="date"
            className={inputClass}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Field>
        <Field label="Technologies (comma separated)">
          <input
            className={inputClass}
            value={technologies}
            onChange={(event) => setTechnologies(event.target.value)}
            placeholder="Python, AWS, Postgres"
            required
          />
        </Field>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => setFeatured(event.target.checked)}
          className="h-5 w-5 rounded border-black/20 accent-ember"
        />
        <span className="text-sm font-semibold text-ink/70">Featured</span>
      </label>

      {error ? <p className="rounded-xl bg-ember/10 px-4 py-3 text-sm font-medium text-ember">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="rounded-full bg-moss px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {initial?.id ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="ml-auto rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
