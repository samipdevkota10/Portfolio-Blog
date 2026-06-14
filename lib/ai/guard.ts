import { countSessionUserMessages } from "@/lib/db/queries";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

export const CHAT_LIMITS = {
  requestsPerMinute: 10,
  maxMessageChars: 2000,
  maxPayloadMessages: 20,
  modelHistoryMessages: 8,
  maxSessionUserMessages: 30,
  dailyGlobalBudget: 300,
} as const;

export type GuardResult =
  | { ok: true }
  | { ok: false; status: 403 | 413 | 429; message: string };

type GuardInput = {
  ip: string;
  origin: string | null;
  referer: string | null;
  sessionId?: string;
  messages: Array<{ role: string; content: string }>;
};

let dailyCount = 0;
let dailyResetAt = 0;

function checkDailyBudget(now = Date.now()) {
  if (now >= dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 24 * 60 * 60 * 1000;
  }

  if (dailyCount >= CHAT_LIMITS.dailyGlobalBudget) {
    return false;
  }

  dailyCount += 1;
  return true;
}

export function resetGuardStateForTests() {
  dailyCount = 0;
  dailyResetAt = 0;
}

function isAllowedOrigin(origin: string | null, referer: string | null) {
  if (process.env.NODE_ENV !== "production" || !env.NEXT_PUBLIC_SITE_URL) {
    return true;
  }

  const allowedHost = new URL(env.NEXT_PUBLIC_SITE_URL).host;
  const candidate = origin ?? referer;

  if (!candidate) {
    return false;
  }

  try {
    return new URL(candidate).host === allowedHost;
  } catch {
    return false;
  }
}

export async function checkChatRequest({ ip, origin, referer, sessionId, messages }: GuardInput): Promise<GuardResult> {
  if (!isAllowedOrigin(origin, referer)) {
    return { ok: false, status: 403, message: "Requests must come from the portfolio site." };
  }

  if (messages.length > CHAT_LIMITS.maxPayloadMessages) {
    return { ok: false, status: 413, message: "Too many messages in this conversation. Please start a new chat." };
  }

  // Only police user input length. Assistant replies are model-generated and can
  // legitimately exceed this; enforcing it on them would reject the whole history
  // on the next turn once a single long answer is echoed back.
  if (
    messages.some(
      (message) => message.role === "user" && message.content.length > CHAT_LIMITS.maxMessageChars,
    )
  ) {
    return {
      ok: false,
      status: 413,
      message: `Messages are limited to ${CHAT_LIMITS.maxMessageChars} characters.`,
    };
  }

  const limit = rateLimit({
    key: `chat:${ip}`,
    limit: CHAT_LIMITS.requestsPerMinute,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return { ok: false, status: 429, message: "You're sending messages too quickly. Please wait a moment." };
  }

  if (sessionId) {
    const sessionMessages = await countSessionUserMessages(sessionId);

    if (sessionMessages >= CHAT_LIMITS.maxSessionUserMessages) {
      return {
        ok: false,
        status: 429,
        message: "This conversation has reached its limit. Please start a new chat later.",
      };
    }
  }

  if (!checkDailyBudget()) {
    return { ok: false, status: 429, message: "The assistant has reached its daily limit. Please try again tomorrow." };
  }

  return { ok: true };
}
