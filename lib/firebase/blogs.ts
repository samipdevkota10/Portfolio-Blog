import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { firestore } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import type { RetrievedSource } from "@/lib/ai/retrieval";

export const EMBEDDING_FIELD = "embedding";
const DISTANCE_FIELD = "vector_distance";

// SourceDocument.type → Firestore collection that holds that content + its embedding.
const COLLECTION_BY_TYPE: Record<string, string> = {
  blog: "Blogs",
  project: "projects",
  experience: "Experiences",
};

const SEARCHABLE_TYPES = ["blog", "project", "experience"] as const;

export const BLOGS_COLLECTION = COLLECTION_BY_TYPE.blog;

async function findRefBySlug(collection: string, slug: string) {
  if (!firestore) return null;
  const snapshot = await firestore.collection(collection).where("slug", "==", slug).limit(1).get();
  return snapshot.docs[0]?.ref ?? null;
}

/** Embed a content doc (blog/project/experience) identified by its slug, after an admin save. */
export async function setContentEmbeddingBySlug(
  type: string,
  slug: string,
  embedding: number[],
  contentText: string,
) {
  const collection = COLLECTION_BY_TYPE[type];
  if (!firestore || !collection) return;
  const ref = await findRefBySlug(collection, slug);
  if (!ref) return;
  await ref.set({ [EMBEDDING_FIELD]: FieldValue.vector(embedding), contentText }, { merge: true });
}

/** Strip the embedding so a doc drops out of vector search (after unpublish/delete). */
export async function clearContentEmbeddingBySlug(slug: string) {
  if (!firestore) return;
  // The caller only knows the slug, not the type — clear it from whichever collection holds it.
  for (const type of SEARCHABLE_TYPES) {
    const ref = await findRefBySlug(COLLECTION_BY_TYPE[type], slug);
    if (ref) {
      await ref.set({ [EMBEDDING_FIELD]: FieldValue.delete() }, { merge: true });
    }
  }
}

async function searchCollection(type: string, embedding: number[], limit: number): Promise<RetrievedSource[]> {
  const collection = COLLECTION_BY_TYPE[type];
  if (!firestore || !collection) return [];

  try {
    const snapshot = await firestore
      .collection(collection)
      .findNearest({
        vectorField: EMBEDDING_FIELD,
        queryVector: embedding,
        limit,
        distanceMeasure: "COSINE",
        distanceResultField: DISTANCE_FIELD,
      })
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const distance = typeof data[DISTANCE_FIELD] === "number" ? (data[DISTANCE_FIELD] as number) : 1;

      return {
        slug: String(data.slug ?? doc.id),
        title: String(data.title ?? "Untitled"),
        type,
        content: String(data.contentText ?? data.bodyText ?? ""),
        summary: String(data.summary ?? ""),
        score: 1 - distance,
      } satisfies RetrievedSource;
    });
  } catch (error) {
    // A missing KNN index (or empty collection) for one type should not sink the whole
    // query — but log it, otherwise vector search silently degrades to the lexical fallback.
    logger.warn("semantic-search-collection-failed", {
      collection,
      error: error instanceof Error ? error.message : "Unknown vector search error",
    });
    return [];
  }
}

/** KNN search across Blogs, projects, and experience; merged and ranked by similarity. */
export async function semanticSearchContent(embedding: number[], limit = 5): Promise<RetrievedSource[]> {
  if (!firestore || embedding.length === 0) return [];

  const perType = await Promise.all(SEARCHABLE_TYPES.map((type) => searchCollection(type, embedding, limit)));

  return perType
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
