import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  createContactSubmission: vi.fn(async () => ({ id: "submission_123" })),
  markContactNotified: vi.fn(async () => undefined),
  trackEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/email", () => ({
  sendContactNotification: vi.fn(async () => ({ id: "email_123" })),
}));

describe("contact route", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("stores valid contact submissions", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Samip",
        email: "samip@example.com",
        subject: "Interesting role",
        message: "Would love to talk about this platform work.",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
  });
});
