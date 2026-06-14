"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setForm(initialState);
      setStatus("success");
      return;
    }

    setStatus("error");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          required
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Your name"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-ember"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="Your email"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-ember"
        />
        <input
          required
          value={form.subject}
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
          placeholder="Project, role, or topic"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-ember md:col-span-2"
        />
        <textarea
          required
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder="Tell me what you're building or hiring for."
          rows={6}
          className="rounded-[1.5rem] border border-black/10 px-4 py-3 outline-none transition focus:border-ember md:col-span-2"
        />
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink/60">
          {status === "success" && "Message received. I'll follow up soon."}
          {status === "error" && "Something went wrong. Please try again."}
          {status === "loading" && "Sending..."}
        </p>
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ember"
          disabled={status === "loading"}
        >
          Send message
        </button>
      </div>
    </form>
  );
}
