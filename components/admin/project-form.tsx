"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/core";

import { saveProject, deleteProject, uploadImage, type ActionResult } from "@/app/admin/content-actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Field, inputClass, slugify, splitLines, splitList } from "@/components/admin/form-fields";

export type ProjectFormData = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  bodyJson: JSONContent;
  role: string;
  technologies: string[];
  impact: string[];
  githubUrl?: string;
  liveUrl?: string;
  coverImage?: string;
  status: "draft" | "published";
  featured: boolean;
};

export function ProjectForm({ initial }: { initial?: ProjectFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [technologies, setTechnologies] = useState(initial?.technologies.join(", ") ?? "");
  const [impact, setImpact] = useState(initial?.impact.join("\n") ?? "");
  const [githubUrl, setGithubUrl] = useState(initial?.githubUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [uploading, setUploading] = useState(false);
  const [bodyJson, setBodyJson] = useState<JSONContent>(
    initial?.bodyJson ?? { type: "doc", content: [{ type: "paragraph" }] },
  );
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    const result = await uploadImage(data);
    setUploading(false);
    if (result.ok) {
      setCoverImage(result.url);
    } else {
      setError(result.error);
    }
  }

  function submit(status: "draft" | "published") {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await saveProject({
        id: initial?.id,
        slug,
        title,
        summary,
        bodyJson: JSON.stringify(bodyJson),
        bodyHtml,
        bodyText,
        role,
        technologies: splitList(technologies),
        impact: splitLines(impact),
        githubUrl,
        liveUrl,
        coverImage,
        status,
        featured,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/projects");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm("Delete this project permanently?")) return;
    startTransition(async () => {
      const result = await deleteProject(initial.id!);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/projects");
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            placeholder="Project title"
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
            placeholder="project-slug"
            required
          />
        </Field>
      </div>

      <Field label="Summary">
        <textarea
          className={`${inputClass} min-h-[5rem]`}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="One or two sentences shown on the project card."
          required
        />
      </Field>

      <Field label="Case study body">
        <RichTextEditor
          initialContent={initial?.bodyJson}
          onChange={(value) => {
            setBodyJson(value.json);
            setBodyHtml(value.html);
            setBodyText(value.text);
          }}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Role">
          <input
            className={inputClass}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Backend engineer"
            required
          />
        </Field>
        <Field label="Technologies (comma separated)">
          <input
            className={inputClass}
            value={technologies}
            onChange={(event) => setTechnologies(event.target.value)}
            placeholder="Next.js, Postgres, OpenAI"
            required
          />
        </Field>
      </div>

      <Field label="Impact (one bullet per line)">
        <textarea
          className={`${inputClass} min-h-[6rem]`}
          value={impact}
          onChange={(event) => setImpact(event.target.value)}
          placeholder={"Cut query latency by 40%\nServes 1k monthly visitors"}
          required
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="GitHub URL (optional)">
          <input
            className={inputClass}
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            placeholder="https://github.com/…"
          />
        </Field>
        <Field label="Live URL (optional)">
          <input
            className={inputClass}
            value={liveUrl}
            onChange={(event) => setLiveUrl(event.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field label="Cover image (optional)">
          <input
            className={inputClass}
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
            placeholder="https://… or upload below"
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleCoverUpload}
            disabled={uploading}
            className="mt-2 text-sm"
          />
          {uploading ? <p className="mt-1 text-sm text-neutral-500">Uploading…</p> : null}
        </Field>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => setFeatured(event.target.checked)}
          className="h-5 w-5 rounded border-black/20 accent-ember"
        />
        <span className="text-sm font-semibold text-ink/70">Featured on home page</span>
      </label>

      {error ? <p className="rounded-xl bg-ember/10 px-4 py-3 text-sm font-medium text-ember">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit("published")}
          className="rounded-full bg-moss px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Publish"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit("draft")}
          className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
        >
          Save draft
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
