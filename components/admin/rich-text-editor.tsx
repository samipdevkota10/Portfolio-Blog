"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import { memo, useCallback, useEffect, useReducer, useRef, useState } from "react";

import { uploadImage } from "@/app/admin/content-actions";
import { richTextExtensions } from "@/lib/content/richtext-extensions";
import type { JSONContent } from "@tiptap/core";

export type RichTextValue = {
  json: JSONContent;
  html: string;
  text: string;
};

type RichTextEditorProps = {
  initialContent?: JSONContent;
  placeholder?: string;
  onChange: (value: RichTextValue) => void;
};

function ToolbarButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
        active ? "bg-ink text-linen" : "text-ink/70 hover:bg-black/5"
      }`}
    >
      {label}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // The editor no longer re-renders on every transaction (that caused the page to
  // jump on click), so the toolbar subscribes locally to keep its active states
  // in sync. This only re-renders the Toolbar, never the EditorContent subtree.
  const [, refreshToolbar] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    editor.on("transaction", refreshToolbar);
    return () => {
      editor.off("transaction", refreshToolbar);
    };
  }, [editor]);

  const setLink = useCallback(() => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImageByUrl = useCallback(() => {
    const url = window.prompt("Image URL", "https://");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setUploadError(null);
      setUploading(true);
      const data = new FormData();
      data.set("file", file);
      const result = await uploadImage(data);
      setUploading(false);

      if (result.ok) {
        editor.chain().focus().setImage({ src: result.url }).run();
      } else {
        setUploadError(result.error);
      }
    },
    [editor],
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-linen/60 px-2 py-1.5">
      <ToolbarButton
        label="H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="H3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <span className="mx-1 h-5 w-px bg-black/10" />
      <ToolbarButton
        label="B"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="I"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <span className="mx-1 h-5 w-px bg-black/10" />
      <ToolbarButton
        label="• List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="1. List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <span className="mx-1 h-5 w-px bg-black/10" />
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink} />
      <ToolbarButton
        label={uploading ? "Uploading…" : "Upload image"}
        onClick={() => fileInputRef.current?.click()}
      />
      <ToolbarButton label="Image URL" onClick={addImageByUrl} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelected}
      />
      {uploadError ? <span className="ml-2 text-xs font-medium text-ember">{uploadError}</span> : null}
    </div>
  );
}

function RichTextEditorImpl({ initialContent, placeholder, onChange }: RichTextEditorProps) {
  // Read onChange through a ref so a changing callback identity from the parent
  // (a new inline arrow every keystroke) never forces the editor subtree to
  // re-render — re-rendering EditorContent mid-transaction makes the page jump.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const emit = useCallback((instance: Editor) => {
    onChangeRef.current({
      json: instance.getJSON(),
      html: instance.getHTML(),
      text: instance.getText(),
    });
  }, []);

  const editor = useEditor({
    extensions: [
      ...richTextExtensions(),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: initialContent ?? "",
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-ink max-w-none min-h-[20rem] px-4 py-3 focus:outline-none text-ink leading-7",
      },
    },
    onCreate: ({ editor: instance }) => {
      emit(instance);
    },
    onUpdate: ({ editor: instance }) => {
      emit(instance);
    },
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
}

// Only re-mount the editor when the document it was seeded with changes — parent
// re-renders that merely pass a new onChange identity must not re-render here.
export const RichTextEditor = memo(
  RichTextEditorImpl,
  (prev, next) =>
    prev.initialContent === next.initialContent && prev.placeholder === next.placeholder,
);
