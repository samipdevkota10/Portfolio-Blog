"use client";

import { useState } from "react";

export function ReindexButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    const response = await fetch("/api/admin/reindex-ai", {
      method: "POST",
    });

    setStatus(response.ok ? "success" : "error");
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ember"
      >
        {status === "loading" ? "Reindexing..." : "Reindex AI corpus"}
      </button>
      <p className="text-sm text-ink/60">
        {status === "success" && "Knowledge base refreshed."}
        {status === "error" && "Unable to reindex. Check env and admin auth."}
      </p>
    </div>
  );
}
