import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  createComment: vi.fn(async () => ({ id: "comment_123" })),
  listApprovedComments: vi.fn(async () => [{ id: "comment_1", author: "Sam", body: "Nice post", createdAt: new Date().toISOString() }]),
  trackEvent: vi.fn(async () => undefined),
}));

describe("comments route", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns approved comments", async () => {
    const { GET } = await import("@/app/api/comments/route");
    const request = new NextRequest("http://localhost:3000/api/comments?slug=test-post");
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.comments).toHaveLength(1);
  });

  it("accepts valid comment payloads", async () => {
    const { POST } = await import("@/app/api/comments/route");
    const request = new NextRequest("http://localhost:3000/api/comments", {
      method: "POST",
      body: JSON.stringify({
        slug: "test-post",
        author: "Sam",
        email: "sam@example.com",
        body: "Really enjoyed this architecture writeup.",
        website: "",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
