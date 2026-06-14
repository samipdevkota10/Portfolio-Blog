import OpenAI from "openai";

import {
  appendChatMessage,
  createChatSession,
  getSourceDocumentBySlug,
  trackEvent,
  updateChatSession,
} from "@/lib/db/queries";
import { env, featureFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import { CHAT_LIMITS } from "@/lib/ai/guard";
import { retrieveRelevantSources, type RetrievedSource } from "@/lib/ai/retrieval";

export type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
};

export type ChatContextInput = {
  path: string;
  page: string;
  slug?: string;
  section?: string;
};

export type ChatMetadata = {
  sessionId: string;
  messageId: string;
  citations: Array<{ slug: string; title: string; type: string }>;
  grounded: boolean;
};

const openai = featureFlags.openai
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

function buildInstructions(context?: ChatContextInput, pinnedTitle?: string) {
  const base = [
    "You are Samip Devkota's portfolio assistant.",
    "Treat the provided portfolio knowledge context as the authoritative source of truth for anything about Samip — his work, projects, experience, and writing. When the context covers the question, ground your answer in it and mention the relevant source titles.",
    "You may also draw on your own general knowledge to add helpful background, explain concepts, compare technologies, or answer broader questions the context does not cover. Blend the two naturally.",
    "Never contradict the portfolio context or invent specific facts about Samip (roles, dates, employers, project details) that are not supported by it. If you are unsure whether something about Samip is accurate, say so rather than guessing.",
    "When you go beyond the documented context, keep it clearly framed as general information rather than a documented fact about Samip.",
    "Keep answers concise, specific, and useful.",
    "If someone wants to get in touch, collaborate, or discuss opportunities, direct them to email samip.devkota@gmail.com or connect on LinkedIn at linkedin.com/in/samip-devkota/.",
    "Be friendly and conversational — you're the first impression visitors get.",
  ];

  if (pinnedTitle) {
    base.push(
      `The visitor is currently viewing "${pinnedTitle}" — when they say "this", they likely mean that document, provided as Source 1.`,
    );
  } else if (context) {
    const where = context.section ? `the ${context.section} section of the ${context.page} page` : `the ${context.page} page`;
    base.push(`The visitor is currently on ${where} of the site.`);
  }

  return base.join(" ");
}

async function resolvePinnedSource(context?: ChatContextInput): Promise<RetrievedSource | null> {
  if (!context?.slug || (context.page !== "blog-post" && context.page !== "project")) {
    return null;
  }

  const document = await getSourceDocumentBySlug(context.slug);

  if (!document) {
    return null;
  }

  return {
    slug: document.slug,
    title: document.title,
    type: String(document.type),
    content: document.body,
    score: 1,
  };
}

export async function streamChatResponse({
  messages,
  sessionId,
  context,
}: {
  messages: ChatMessageInput[];
  sessionId?: string;
  context?: ChatContextInput;
}) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const question = latestUserMessage?.content?.trim();

  if (!question) {
    throw new Error("A user question is required.");
  }

  const [pinnedSource, retrieved] = await Promise.all([
    resolvePinnedSource(context),
    retrieveRelevantSources(question, 4),
  ]);
  const retrievedSources = pinnedSource
    ? [pinnedSource, ...retrieved.filter((source) => source.slug !== pinnedSource.slug)].slice(0, 4)
    : retrieved;
  const grounded = retrievedSources.length > 0;
  const resolvedSessionId = sessionId ?? (await createChatSession("Portfolio assistant"))?.id ?? crypto.randomUUID();
  const resolvedMessageId = crypto.randomUUID();
  const citations = retrievedSources.map((source) => ({
    slug: source.slug,
    title: source.title,
    type: source.type,
  }));

  // Persist the user turn in parallel with the model request — the model does not
  // need these writes to start, so awaiting them here only delays the first token.
  const persistUserTurn = Promise.all([
    updateChatSession(resolvedSessionId, question),
    appendChatMessage({
      sessionId: resolvedSessionId,
      role: "user",
      content: question,
      grounded: true,
      citations: [],
    }),
  ]);

  if (!featureFlags.openai || !openai) {
    await persistUserTurn;
    const fallbackText = grounded
      ? `I found relevant portfolio context, but the OpenAI API is not configured locally. The most relevant sources are ${citations
          .map((citation) => citation.title)
          .join(", ")}.`
      : "I cannot answer confidently because the model and knowledge base are not configured locally.";

    await appendChatMessage({
      sessionId: resolvedSessionId,
      role: "assistant",
      content: fallbackText,
      grounded,
      citations,
    });

    return {
      metadata: {
        sessionId: resolvedSessionId,
        messageId: resolvedMessageId,
        citations,
        grounded,
      },
      stream: null,
      fallbackText,
      requestId: undefined,
    };
  }

  const contextBlock = grounded
    ? retrievedSources
        .map(
          (source, index) =>
            `[Source ${index + 1}] ${source.title} (${source.type}/${source.slug})\n${source.content}`,
        )
        .join("\n\n")
    : "No relevant sources were retrieved.";

  const stream = await openai.responses.create({
    model: env.OPENAI_CHAT_MODEL,
    instructions: buildInstructions(context, pinnedSource?.title),
    input: [
      ...messages.slice(-CHAT_LIMITS.modelHistoryMessages).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "system" as const,
        content: `Portfolio knowledge context:\n${contextBlock}\n\nWhen you use a source, mention its title naturally in the answer.`,
      },
    ],
    reasoning: { effort: "minimal" },
    stream: true,
    store: true,
    max_output_tokens: 600,
  });

  const requestId = stream._request_id ?? undefined;

  await Promise.all([
    persistUserTurn,
    trackEvent("chat.requested", {
      sessionId: resolvedSessionId,
      grounded,
      citations,
    }),
  ]);

  return {
    metadata: {
      sessionId: resolvedSessionId,
      messageId: resolvedMessageId,
      citations,
      grounded,
    },
    stream,
    fallbackText: null,
    requestId,
  };
}

export async function persistAssistantMessage({
  sessionId,
  content,
  citations,
  grounded,
  responseId,
  requestId,
}: {
  sessionId: string;
  content: string;
  citations: Array<{ slug: string; title: string; type: string }>;
  grounded: boolean;
  responseId?: string;
  requestId?: string;
}) {
  await appendChatMessage({
    sessionId,
    role: "assistant",
    content,
    grounded,
    citations,
    responseId,
    requestId,
  });

  logger.info("chat.response.persisted", {
    sessionId,
    grounded,
    citations: citations.length,
  });
}
