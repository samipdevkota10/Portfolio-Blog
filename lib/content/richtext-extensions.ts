import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

/**
 * Shared extension list used by both the admin editor (client) and
 * server-side HTML/JSON generation, so output stays consistent.
 */
export function richTextExtensions() {
  return [
    StarterKit.configure({
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    Image,
  ];
}
