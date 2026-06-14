import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHAT_LIMITS, checkChatRequest, resetGuardStateForTests } from "@/lib/ai/guard";

vi.mock("@/lib/db/queries", () => ({
  countSessionUserMessages: vi.fn(async (sessionId: string) =>
    sessionId === "full-session" ? CHAT_LIMITS.maxSessionUserMessages : 0,
  ),
}));

function makeInput(overrides: Partial<Parameters<typeof checkChatRequest>[0]> = {}) {
  return {
    ip: `ip-${Math.random()}`,
    origin: null,
    referer: null,
    sessionId: undefined,
    messages: [{ role: "user", content: "Tell me about the projects." }],
    ...overrides,
  };
}

describe("chat guard", () => {
  beforeEach(() => {
    resetGuardStateForTests();
  });

  it("allows a normal request", async () => {
    expect(await checkChatRequest(makeInput())).toEqual({ ok: true });
  });

  it("rejects oversized messages with 413", async () => {
    const result = await checkChatRequest(
      makeInput({ messages: [{ role: "user", content: "x".repeat(CHAT_LIMITS.maxMessageChars + 1) }] }),
    );
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects payloads with too many messages with 413", async () => {
    const messages = Array.from({ length: CHAT_LIMITS.maxPayloadMessages + 1 }, () => ({
      role: "user",
      content: "hi",
    }));
    const result = await checkChatRequest(makeInput({ messages }));
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it("rate limits per IP with 429", async () => {
    const ip = `ip-${Date.now()}`;
    let result = await checkChatRequest(makeInput({ ip }));

    for (let i = 0; i < CHAT_LIMITS.requestsPerMinute; i += 1) {
      result = await checkChatRequest(makeInput({ ip }));
    }

    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("rejects sessions that exhausted their message budget with 429", async () => {
    const result = await checkChatRequest(makeInput({ sessionId: "full-session" }));
    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("enforces the daily global budget with 429", async () => {
    let result = await checkChatRequest(makeInput());

    for (let i = 0; i < CHAT_LIMITS.dailyGlobalBudget; i += 1) {
      result = await checkChatRequest(makeInput());
    }

    expect(result).toMatchObject({ ok: false, status: 429 });
  });
});
