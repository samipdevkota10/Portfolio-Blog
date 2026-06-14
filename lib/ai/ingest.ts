import OpenAI from "openai";

import { collectSourceDocuments, type SourceDocument } from "@/lib/ai/documents";
import { clearContentEmbeddingBySlug, setContentEmbeddingBySlug } from "@/lib/firebase/blogs";
import { env, featureFlags, requireEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const SEARCHABLE_TYPES = new Set<SourceDocument["type"]>(["blog", "project", "experience"]);

const openai = featureFlags.openai
  ? new OpenAI({
      apiKey: requireEnv("OPENAI_API_KEY"),
    })
  : null;

async function embed(text: string) {
  if (!openai) return [] as number[];
  const response = await openai.embeddings.create({ model: env.OPENAI_EMBED_MODEL, input: text });
  return response.data[0]?.embedding ?? [];
}

/**
 * Re-index a single document. The RAG corpus spans the blog, project, and
 * experience collections — each stores one embedding per doc. Other types
 * (e.g. profile) are a no-op so callers don't need to special-case them.
 */
export async function reindexDocument(document: SourceDocument) {
  if (!featureFlags.firebase || !featureFlags.openai || !openai) {
    return { ok: false as const, reason: "Firebase or OpenAI configuration missing." };
  }

  if (!SEARCHABLE_TYPES.has(document.type)) {
    return { ok: true as const, chunks: 0 };
  }

  const embedding = await embed(`${document.title}\n\n${document.summary}\n\n${document.body}`);
  await setContentEmbeddingBySlug(document.type, document.slug, embedding, document.body);

  logger.info("document-reindexed", { slug: document.slug, type: document.type });
  return { ok: true as const, chunks: 1 };
}

/** Remove a document from the retrieval corpus (after unpublish/delete). */
export async function removeDocumentFromIndex(slug: string) {
  if (!featureFlags.firebase) {
    return;
  }

  await clearContentEmbeddingBySlug(slug);
  logger.info("document-removed-from-index", { slug });
}

export async function reindexKnowledgeBase() {
  if (!featureFlags.firebase || !featureFlags.openai || !openai) {
    return {
      ok: false,
      reason: "Firebase or OpenAI configuration missing.",
    };
  }

  const documents = (await collectSourceDocuments()).filter((document) => SEARCHABLE_TYPES.has(document.type));

  for (const document of documents) {
    const embedding = await embed(`${document.title}\n\n${document.summary}\n\n${document.body}`);
    await setContentEmbeddingBySlug(document.type, document.slug, embedding, document.body);
  }

  logger.info("knowledge-base-reindexed", { documents: documents.length });

  return {
    ok: true,
    documents: documents.length,
    chunks: documents.length,
  };
}
