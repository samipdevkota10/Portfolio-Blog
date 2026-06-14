import { generateHTML, generateJSON } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";

import { richTextExtensions } from "@/lib/content/richtext-extensions";

export type RichTextDoc = JSONContent;

export { richTextExtensions };

export function tiptapToHtml(doc: RichTextDoc): string {
  return generateHTML(doc, richTextExtensions());
}

export function htmlToTiptapJson(html: string): RichTextDoc {
  return generateJSON(html, richTextExtensions());
}

const blockNodes = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "bulletList",
  "orderedList",
  "horizontalRule",
]);

/** Extract plain text from a Tiptap document (for RAG, search, reading time). */
export function tiptapToText(doc: RichTextDoc): string {
  const parts: string[] = [];

  function walk(node: JSONContent) {
    if (node.type === "text" && node.text) {
      parts.push(node.text);
    }

    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }

    if (node.type && blockNodes.has(node.type)) {
      parts.push("\n");
    }
  }

  walk(doc);

  return parts
    .join("")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export const emptyRichTextDoc: RichTextDoc = { type: "doc", content: [{ type: "paragraph" }] };
