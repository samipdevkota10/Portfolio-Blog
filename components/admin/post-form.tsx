"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/core";

import { savePost, deletePost, uploadImage, type ActionResult } from "@/app/admin/content-actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Field, inputClass, slugify, splitList } from "@/components/admin/form-fields";

export type PostFormData = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  bodyJson: JSONContent;
  tags: string[];
  coverImage?: string;
  canonicalUrl?: string;
  status: "draft" | "published";
  featured: boolean;
};

export function PostForm({ initial }: { initial?: PostFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonicalUrl ?? "");
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
      const result: ActionResult = await savePost({
        id: initial?.id,
        slug,
        title,
        summary,
        bodyJson: JSON.stringify(bodyJson),
        bodyHtml,
        bodyText,
        tags: splitList(tags),
        coverImage,
        canonicalUrl,
        status,
        featured,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/posts");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm("Delete this post permanently?")) return;
    startTransition(async () => {
      const result = await deletePost(initial.id!);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/posts");
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
            placeholder="Post title"
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
            placeholder="post-slug"
            required
          />
        </Field>
      </div>

      <Field label="Summary">
        <textarea
          className={`${inputClass} min-h-[5rem]`}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="One or two sentences shown on cards and used for SEO."
          required
        />
      </Field>

      <Field label="Body">
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
        <Field label="Tags (comma separated)">
          <input
            className={inputClass}
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="ai, nextjs, postgres"
            required
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

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Canonical URL (optional)">
          <input
            className={inputClass}
            value={canonicalUrl}
            onChange={(event) => setCanonicalUrl(event.target.value)}
            placeholder="https://…"
          />
        </Field>
        <label className="flex items-center gap-3 self-end pb-2">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
            className="h-5 w-5 rounded border-black/20 accent-ember"
          />
          <span className="text-sm font-semibold text-ink/70">Featured on home page</span>
        </label>
      </div>

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
