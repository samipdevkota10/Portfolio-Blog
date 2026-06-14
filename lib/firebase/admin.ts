import "server-only";

import { cert, getApp, getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import { env, featureFlags } from "@/lib/env";

declare global {
  var __portfolioFirebaseApp: App | undefined;
}

function parseServiceAccount(raw: string) {
  const parsed = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
  // Private keys pasted into env files keep their newlines escaped as "\n".
  return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

function createApp(): App | null {
  if (!featureFlags.firebase) {
    return null;
  }

  if (getApps().length) {
    return getApp();
  }

  if (env.FIREBASE_SERVICE_ACCOUNT) {
    const account = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
    return initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key,
      }),
    });
  }

  // Falls back to GOOGLE_APPLICATION_CREDENTIALS (file path) if that is set instead.
  return initializeApp({ credential: applicationDefault() });
}

function getApp_() {
  if (!globalThis.__portfolioFirebaseApp) {
    globalThis.__portfolioFirebaseApp = createApp() ?? undefined;
  }

  return globalThis.__portfolioFirebaseApp ?? null;
}

export function getFirestoreDb(): Firestore | null {
  const app = getApp_();
  return app ? getFirestore(app) : null;
}

export function getStorageClient(): Storage | null {
  const app = getApp_();
  return app ? getStorage(app) : null;
}

export const firestore = getFirestoreDb();

