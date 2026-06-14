import { describe, expect, it } from "vitest";

import { chunkDocument } from "@/lib/ai/documents";

describe("chunkDocument", () => {
  it("chunks long text into overlapping segments", () => {
    const content = new Array(450).fill("token").join(" ");
    const chunks = chunkDocument(content, 100, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeGreaterThan(0);
  });
});
