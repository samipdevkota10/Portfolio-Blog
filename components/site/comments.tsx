"use client";

import { useEffect, useState } from "react";

type Comment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export function CommentsPanel({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    fetch(`/api/comments?slug=${slug}`)
      .then((response) => response.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  }, [slug]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug,
        author,
        email,
        body,
        website: "",
      }),
    });

    if (response.ok) {
      setStatus("success");
      setAuthor("");
      setEmail("");
      setBody("");
      return;
    }

    setStatus("error");
  }

  return (
    <section className="space-y-6 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h3 className="font-serif text-3xl tracking-tight text-ink">Comments</h3>
        <p className="text-base text-ink/70">Comments are moderated before they appear publicly.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <input
          required
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="Your name"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-ember"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email (optional)"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-ember"
        />
        <textarea
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share a thoughtful question or response."
          rows={4}
          className="rounded-[1.5rem] border border-black/10 px-4 py-3 outline-none transition focus:border-ember md:col-span-2"
        />
        <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
        <div className="md:col-span-2 flex items-center justify-between gap-4">
          <p className="text-sm text-ink/60">
            {status === "success" && "Comment submitted for review."}
            {status === "error" && "Unable to submit comment right now."}
            {status === "loading" && "Submitting..."}
          </p>
          <button type="submit" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ember">
            Submit
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-ink/60">No approved comments yet.</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-[1.5rem] border border-black/5 bg-linen p-4">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/60">{comment.author}</h4>
                <p className="text-sm text-ink/50">{new Date(comment.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="mt-3 text-base leading-7 text-ink/80">{comment.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
