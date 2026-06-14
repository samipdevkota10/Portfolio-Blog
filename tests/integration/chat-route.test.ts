import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/chat", () => ({
  streamChatResponse: vi.fn(async () => ({
    metadata: {
      sessionId: "33333333-3333-4333-8333-333333333333",
      messageId: "44444444-4444-4444-8444-444444444444",
      citations: [],
      grounded: false,
    },
    stream: null,
    fallbackText: "Fallback answer.",
    requestId: undefined,
  })),
  persistAssistantMessage: vi.fn(async () => undefined),
}));

vi.mock("@/lib/db/queries", () => ({
  countSessionUserMessages: vi.fn(async () => 0),
}));

function makeRequest(body: unknown, ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`) {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
  });
}

describe("chat route", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects invalid payloads with 400", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(makeRequest({ messages: [] }));

    expect(response.status).toBe(400);
  });

  it("streams a fallback response for valid payloads", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      makeRequest({
        messages: [{ role: "user", content: "Tell me about the projects." }],
        context: { path: "/projects", page: "projects" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const body = await new Response(response.body).text();
    expect(body).toContain("event: meta");
    expect(body).toContain("Fallback answer.");
    expect(body).toContain("event: done");
  });

  it("rejects oversized messages with 413", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      makeRequest({
        messages: [{ role: "user", content: "x".repeat(3000) }],
      }),
    );

    expect(response.status).toBe(413);
    const payload = await response.json();
    expect(payload.message).toBeTruthy();
  });

  it("rate limits repeated requests from one IP with 429", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const ip = "198.51.100.7";

    let response: Response | null = null;
    for (let i = 0; i < 11; i += 1) {
      response = await POST(makeRequest({ messages: [{ role: "user", content: "hi" }] }, ip));
    }

    expect(response?.status).toBe(429);
  });
});
