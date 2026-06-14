import OpenAI from "openai";
import { FieldValue } from "firebase-admin/firestore";

import { env, featureFlags } from "@/lib/env";
import { firestore } from "@/lib/firebase/admin";
import { BLOGS_COLLECTION, EMBEDDING_FIELD } from "@/lib/firebase/blogs";

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

async function main() {
  if (!featureFlags.firebase || !firestore) {
    throw new Error("Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT (or GOOGLE_APPLICATION_CREDENTIALS).");
  }
  if (!featureFlags.openai) {
    throw new Error("OPENAI_API_KEY is required to generate embeddings.");
  }

  const force = process.argv.includes("--force");
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const snapshot = await firestore.collection(BLOGS_COLLECTION).get();

  let migrated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data[EMBEDDING_FIELD] && !force) {
      skipped += 1;
      continue;
    }

    const title = String(data.title ?? "");

    // Resolve the post body. New admin posts have bodyHtml inline; legacy posts
    // keep their HTML in Firebase Storage, referenced by contentURL.
    let bodyHtml = typeof data.bodyHtml === "string" ? data.bodyHtml : typeof data.content === "string" ? data.content : "";
    if (!bodyHtml && typeof data.contentURL === "string") {
      const response = await fetch(data.contentURL);
      if (!response.ok) {
        console.warn(`Skipping ${doc.id}: failed to fetch contentURL (${response.status})`);
        skipped += 1;
        continue;
      }
      bodyHtml = await response.text();
    }

    const bodyText = htmlToText(bodyHtml);
    const input = `${title}\n\n${bodyText}`.trim();
    if (!input) {
      console.warn(`Skipping ${doc.id}: no title or body to embed.`);
      skipped += 1;
      continue;
    }

    const embedding = await openai.embeddings.create({ model: env.OPENAI_EMBED_MODEL, input });

    // Only fill fields that are missing so we never clobber edits made in the new admin.
    const patch: Record<string, unknown> = {
      [EMBEDDING_FIELD]: FieldValue.vector(embedding.data[0]?.embedding ?? []),
      bodyHtml,
      bodyText,
      contentText: bodyText,
    };
    if (!data.slug) patch.slug = slugify(title) || doc.id;
    if (!data.summary) patch.summary = bodyText.slice(0, 200);
    if (!data.status) patch.status = "published";
    if (!data.bodyJson) patch.bodyJson = {};
    if (!Array.isArray(data.tags)) patch.tags = [];
    if (data.featured === undefined) patch.featured = false;
    if (!data.publishedAt) patch.publishedAt = data.createdAt ?? new Date();

    await doc.ref.set(patch, { merge: true });
    migrated += 1;
    console.log(`Migrated ${doc.id} — ${patch.slug ?? data.slug} (${title || "untitled"})`);
  }

  console.log(`\nDone. Migrated ${migrated}, skipped ${skipped}, total ${snapshot.size}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
