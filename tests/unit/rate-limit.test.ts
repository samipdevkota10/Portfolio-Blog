import { describe, expect, it } from "vitest";

import { rateLimit } from "@/lib/rate-limit";

describe("rate limit", () => {
  it("blocks after the configured threshold", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit({ key, limit: 2, windowMs: 1_000 }).allowed).toBe(true);
    expect(rateLimit({ key, limit: 2, windowMs: 1_000 }).allowed).toBe(true);
    expect(rateLimit({ key, limit: 2, windowMs: 1_000 }).allowed).toBe(false);
  });
});
