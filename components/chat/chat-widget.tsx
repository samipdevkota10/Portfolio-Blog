"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { usePageContext } from "@/components/chat/page-context";

const PAGE_NUDGES: Record<string, string> = {
  home: "Hey! I'm Samip's AI assistant. Ask me anything about his work.",
  blog: "Looking for something specific? I can help you find the right post.",
  "blog-post": "Want to discuss this post? I've read it — ask me anything.",
  projects: "Curious how any of these were built? Ask me.",
  project: "Want the full story on this project — stack, tradeoffs, impact? Ask away.",
  experience: "Want to know more about any of these roles? I've got the details.",
  tags: "Exploring a topic? I can point you to the best stuff.",
};

const SECTION_NUDGES: Record<string, string> = {
  hero: "I'm Samip's AI — I follow along as you scroll. Try asking me something!",
  writing: "See a blog that looks interesting? I can summarize it or go deeper.",
  projects: "Curious about any of these projects? Ask me how they were built.",
  experience: "I can tell you more about Samip's experience at any of these roles.",
};

function resolveNudge(page: string, section?: string) {
  return (section && SECTION_NUDGES[section]) ?? PAGE_NUDGES[page] ?? null;
}

// Short header line shown persistently while the panel is open, so the prompt
// always reflects whatever section the visitor is currently viewing.
const SECTION_HEADERS: Record<string, string> = {
  hero: "Ask me anything about Samip",
  writing: "Ask about the blog & writing",
  projects: "Ask how these projects were built",
  experience: "Ask about Samip's experience",
};

const PAGE_HEADERS: Record<string, string> = {
  home: "Ask me anything",
  blog: "Find or summarize a post",
  "blog-post": "Ask about this post",
  projects: "Ask how these were built",
  project: "Ask about this project",
  experience: "Ask about Samip's experience",
  tags: "Explore this topic",
};

function resolveHeader(page: string, section?: string) {
  return (section && SECTION_HEADERS[section]) ?? PAGE_HEADERS[page] ?? "Ask me anything";
}

export function ChatWidget() {
  const context = usePageContext();
  const [open, setOpen] = useState(true);
  const [nudge, setNudge] = useState<string | null>(() => resolveNudge("home"));
  const prevContextRef = useRef<string>("home:");

  useEffect(() => {
    const contextKey = `${context.page}:${context.section ?? ""}`;

    if (contextKey === prevContextRef.current) {
      return;
    }

    prevContextRef.current = contextKey;

    const copy = resolveNudge(context.page, context.section);

    if (!copy) {
      return;
    }

    const showTimer = setTimeout(() => setNudge(copy), 50);
    const hideTimer = setTimeout(() => setNudge(null), 6050);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [context.page, context.section]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-[min(40rem,calc(100vh-7rem))] w-[min(30rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <div className="flex flex-col border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">AI Assistant</p>
                  <AnimatePresence mode="wait">
                    <motion.h3
                      key={resolveHeader(context.page, context.section)}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="font-serif text-lg"
                    >
                      {resolveHeader(context.page, context.section)}
                    </motion.h3>
                  </AnimatePresence>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AnimatePresence mode="wait">
                {nudge ? (
                  <motion.p
                    key={nudge}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 text-xs leading-5 text-white/50"
                  >
                    {nudge}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
            <ChatPanel context={context} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!open && nudge ? (
          <motion.button
            key="nudge"
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => {
              setNudge(null);
              setOpen(true);
            }}
            className="max-w-[18rem] rounded-[1.25rem] border border-black/10 bg-white px-4 py-3 text-left text-sm leading-5 text-ink shadow-xl"
          >
            {nudge}
          </motion.button>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          setNudge(null);
          setOpen((current) => !current);
        }}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ember text-white shadow-2xl transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
