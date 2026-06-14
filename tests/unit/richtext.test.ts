import { describe, expect, it } from "vitest";

import { htmlToTiptapJson, tiptapToHtml, tiptapToText } from "@/lib/content/richtext";

describe("richtext conversions", () => {
  it("round-trips html through tiptap json", () => {
    const doc = htmlToTiptapJson("<h2>Title</h2><p>Hello <strong>world</strong></p>");
    const html = tiptapToHtml(doc);

    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>world</strong>");
  });

  it("extracts plain text from a tiptap doc", () => {
    const doc = htmlToTiptapJson("<h2>Title</h2><p>Hello world</p><ul><li>One</li><li>Two</li></ul>");
    const text = tiptapToText(doc);

    expect(text).toContain("Title");
    expect(text).toContain("Hello world");
    expect(text).toContain("One");
    expect(text).not.toContain("<");
  });
});
