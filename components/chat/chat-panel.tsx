
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ChatPageContext } from "@/components/chat/page-context";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ slug: string; title: string; type: string }>;
};

type StreamMeta = {
  sessionId: string;
  messageId: string;
  citations: Array<{ slug: string; title: string; type: string }>;
  grounded: boolean;
};

function createAssistantGreeting(): ChatMessage {
  return {
    role: "assistant",
    content:
      "Ask me about Samip's projects, experience, writing, or how this site is built. I only answer from the documented portfolio context.",
  };
}

const SECTION_PROMPTS: Record<string, string> = {
  hero: "Ask me anything about Samip…",
  writing: "Ask about this blog or what Samip writes about…",
  projects: "Ask how any of these projects were built…",
  experience: "Ask about Samip's roles and experience…",
};

const PAGE_PROMPTS: Record<string, string> = {
  home: "Ask about projects, experience, or writing…",
  blog: "Ask me to find or summarize a post…",
  "blog-post": "Ask anything about this post…",
  projects: "Ask how any of these projects were built…",
  project: "Ask about this project — stack, tradeoffs, impact…",
  experience: "Ask about Samip's roles and experience…",
  tags: "Ask me to point you to the best posts on this topic…",
};

// The input placeholder follows whatever section the visitor is currently viewing,
// falling back to a per-page prompt, so the question hint stays contextual as they scroll.
function resolvePrompt(context: ChatPageContext): string {
  return (
    (context.section && SECTION_PROMPTS[context.section]) ??
    PAGE_PROMPTS[context.page] ??
    "Ask about projects, experience, or writing…"
  );
}

export function ChatPanel({ context }: { context: ChatPageContext }) {
  const [messages, setMessages] = useState<ChatMessage[]>([createAssistantGreeting()]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const metaRef = useRef<StreamMeta | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const prompt = resolvePrompt(context);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const payloadMessages = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || status === "loading") {
      return;
    }

    const nextUserMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((current) => [...current, nextUserMessage, { role: "assistant", content: "" }]);
    setInput("");
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          messages: [...payloadMessages, nextUserMessage],
          context: {
            path: context.path,
            page: context.page,
            slug: context.slug,
            section: context.section,
          },
        }),
      });

      if (!response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const body = (await response.json()) as { message?: string };
        setMessages((current) => current.slice(0, -1));
        setError(body.message ?? "The assistant is unavailable right now.");
        setStatus("idle");
        return;
      }

      if (!response.body) {
        setStatus("idle");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const [eventLine, dataLine] = part.split("\n");
          const event = eventLine?.replace("event: ", "");
          const data = dataLine?.replace("data: ", "");

          if (!event || !data) {
            continue;
          }

          if (event === "meta") {
            const parsed = JSON.parse(data) as StreamMeta;
            setSessionId(parsed.sessionId);
            metaRef.current = parsed;
          }

          if (event === "chunk") {
            const parsed = JSON.parse(data) as { text: string };
            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];
              next[next.length - 1] = {
                ...last,
                role: "assistant",
                content: `${last?.content ?? ""}${parsed.text}`,
                citations: metaRef.current?.citations,
              };
              return next;
            });
          }

          if (event === "done") {
            setStatus("idle");
          }

          if (event === "error") {
            const parsed = JSON.parse(data) as { message?: string };
            setStatus("idle");
            setError(parsed.message ?? "Chat streaming failed.");
          }
        }
      }
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={viewportRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={message.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                message.role === "user"
                  ? "ml-auto inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-[1.25rem] bg-ember px-4 py-3 text-sm leading-6 text-white"
                  : "inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-[1.25rem] bg-white/5 px-4 py-3 text-sm leading-6 text-white/90"
              }
            >
              {message.content || (status === "loading" && index === messages.length - 1 ? "…" : message.content)}
            </div>
          </div>
        ))}
        {error ? (
          <p className="rounded-[1rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/10 p-4">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          placeholder={prompt}
          className="w-full resize-none rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-ember"
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-200 disabled:opacity-60"
          >
            {status === "loading" ? "Thinking..." : "Ask"}
          </button>
        </div>
      </form>
    </div>
  );
}
