import OpenAI from "openai";

import { collectSourceDocuments } from "@/lib/ai/documents";
import { env, featureFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import { semanticSearchContent } from "@/lib/firebase/blogs";

export type RetrievedSource = {
  slug: string;
  title: string;
  type: string;
  content: string;
  score: number;
  summary?: string;
};

const openai = featureFlags.openai
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

function lexicalScore(query: string, content: string) {
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  const haystack = content.toLowerCase();

  return tokens.reduce((score, token) => {
    const occurrences = haystack.split(token).length - 1;
    return score + occurrences;
  }, 0);
}

async function localRetrieval(query: string, limit = 5): Promise<RetrievedSource[]> {
  const documents = await collectSourceDocuments();

  return documents
    .map((document) => ({
      slug: document.slug,
      title: document.title,
      type: document.type,
      content: document.body,
      summary: document.summary,
      score: lexicalScore(query, `${document.title} ${document.summary} ${document.body}`),
    }))
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function retrieveRelevantSources(query: string, limit = 5): Promise<RetrievedSource[]> {
  if (!featureFlags.openai || !openai || !featureFlags.firebase) {
    return localRetrieval(query, limit);
  }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: env.OPENAI_EMBED_MODEL,
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding ?? [];

    const results = await semanticSearchContent(queryEmbedding, limit);
    return results.length > 0 ? results : localRetrieval(query, limit);
  } catch (error) {
    logger.warn("semantic-search-fallback", {
      error: error instanceof Error ? error.message : "Unknown semantic search error",
    });

    return localRetrieval(query, limit);
  }
}
