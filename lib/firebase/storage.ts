import "server-only";

import { randomUUID } from "node:crypto";

import { getStorageClient } from "@/lib/firebase/admin";
import { env, featureFlags } from "@/lib/env";

/**
 * Upload a file buffer to Firebase Storage and return a publicly readable URL.
 * Used for blog/project cover images from the admin editor.
 */
export async function uploadPublicFile(
  buffer: Buffer,
  contentType: string,
  folder = "uploads",
): Promise<string> {
  const storage = getStorageClient();

  if (!storage || !featureFlags.firebase) {
    throw new Error("Firebase Storage is not configured. Set FIREBASE_SERVICE_ACCOUNT.");
  }

  if (!env.FIREBASE_STORAGE_BUCKET) {
    throw new Error("FIREBASE_STORAGE_BUCKET is not set.");
  }

  const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
  const extension = contentType.split("/")[1] ?? "bin";
  const objectPath = `${folder}/${randomUUID()}.${extension}`;
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
}
