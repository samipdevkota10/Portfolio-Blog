import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { firestore } from "@/lib/firebase/admin";

const COMMENTS = "comments";
const CONTACTS = "contact_submissions";
const CHAT_SESSIONS = "chat_sessions";
const CHAT_MESSAGES = "chat_messages";
const EVENTS = "events";
const BLOGS = "Blogs";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(0).toISOString();
}

export type CommentInput = {
  slug: string;
  author: string;
  email?: string;
  body: string;
  honeypot?: string;
  ipHash?: string;
};

export async function listApprovedComments(slug: string) {
  if (!firestore) return [];
  const snapshot = await firestore
    .collection(COMMENTS)
    .where("slug", "==", slug)
    .where("status", "==", "approved")
    .get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIso(doc.data().createdAt) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createComment(input: CommentInput) {
  if (!firestore) return null;
  const now = new Date();
  const ref = await firestore.collection(COMMENTS).add({
    slug: input.slug,
    author: input.author,
    email: input.email ?? null,
    body: input.body,
    honeypot: input.honeypot ?? null,
    ipHash: input.ipHash ?? null,
    status: "pending",
    createdAt: now,
    reviewedAt: null,
  });
  return { id: ref.id, ...input, status: "pending" as const };
}

export async function moderateComment(id: string, status: "approved" | "rejected") {
  if (!firestore) return null;
  const ref = firestore.collection(COMMENTS).doc(id);
  await ref.set({ status, reviewedAt: new Date() }, { merge: true });
  const saved = await ref.get();
  return saved.exists ? { id: saved.id, ...saved.data() } : null;
}

export async function listPendingComments() {
  if (!firestore) return [];
  const snapshot = await firestore.collection(COMMENTS).where("status", "==", "pending").get();
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      slug: String(doc.data().slug ?? ""),
      author: String(doc.data().author ?? ""),
      body: String(doc.data().body ?? ""),
      createdAt: toIso(doc.data().createdAt),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createContactSubmission(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!firestore) return null;
  const ref = await firestore.collection(CONTACTS).add({
    ...input,
    status: "received",
    createdAt: new Date(),
  });
  return { id: ref.id, ...input, status: "received" as const };
}

export async function markContactNotified(id: string) {
  if (!firestore) return;
  await firestore.collection(CONTACTS).doc(id).set({ status: "notified" }, { merge: true });
}

export async function listRecentContactSubmissions() {
  if (!firestore) return [];
  const snapshot = await firestore.collection(CONTACTS).get();
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? ""),
      email: String(doc.data().email ?? ""),
      subject: String(doc.data().subject ?? ""),
      message: String(doc.data().message ?? ""),
      status: String(doc.data().status ?? "received"),
      createdAt: toIso(doc.data().createdAt),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);
}

export async function createChatSession(label?: string) {
  if (!firestore) return null;
  const now = new Date();
  const ref = await firestore.collection(CHAT_SESSIONS).add({
    label: label ?? null,
    lastQuestion: null,
    createdAt: now,
    updatedAt: now,
  });
  return { id: ref.id };
}

export async function updateChatSession(sessionId: string, lastQuestion: string) {
  if (!firestore) return;
  await firestore
    .collection(CHAT_SESSIONS)
    .doc(sessionId)
    .set({ lastQuestion, updatedAt: new Date() }, { merge: true });
}

export async function appendChatMessage(input: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  grounded: boolean;
  citations: Array<{ slug: string; title: string; type: string }>;
  responseId?: string;
  requestId?: string;
}) {
  if (!firestore) return null;
  const ref = await firestore.collection(CHAT_MESSAGES).add({
    sessionId: input.sessionId,
    role: input.role,
    content: input.content,
    grounded: input.grounded,
    citations: input.citations,
    responseId: input.responseId ?? null,
    requestId: input.requestId ?? null,
    createdAt: new Date(),
  });
  return { id: ref.id };
}

export async function trackEvent(name: string, payload: Record<string, unknown>) {
  if (!firestore) return;
  await firestore.collection(EVENTS).add({ name, payload, createdAt: new Date() });
}

export async function adminOverview() {
  if (!firestore) {
    return { pendingComments: 0, recentContacts: 0, sourceDocuments: 0, chatMessages: 0 };
  }

  const [pending, contacts, blogs, messages] = await Promise.all([
    firestore.collection(COMMENTS).where("status", "==", "pending").count().get(),
    firestore.collection(CONTACTS).count().get(),
    firestore.collection(BLOGS).count().get(),
    firestore.collection(CHAT_MESSAGES).count().get(),
  ]);

  return {
    pendingComments: pending.data().count,
    recentContacts: contacts.data().count,
    sourceDocuments: blogs.data().count,
    chatMessages: messages.data().count,
  };
}

export async function getSourceDocumentBySlug(slug: string) {
  if (!firestore) return null;
  const snapshot = await firestore.collection(BLOGS).where("slug", "==", slug).limit(1).get();
  const doc = snapshot.docs[0];
  if (!doc) return null;
  const data = doc.data();
  return {
    slug,
    title: String(data.title ?? "Untitled"),
    type: "blog",
    body: String(data.contentText ?? data.bodyText ?? ""),
  };
}

export async function countSessionUserMessages(sessionId: string) {
  if (!firestore) return 0;
  const snapshot = await firestore
    .collection(CHAT_MESSAGES)
    .where("sessionId", "==", sessionId)
    .where("role", "==", "user")
    .count()
    .get();
  return snapshot.data().count;
}
