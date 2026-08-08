"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const COLOR_SWATCHES = ["#F5F5F8", "#2EC5F0", "#6C3CE9", "#EF4444", "#22C55E", "#F59E0B"];

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] w-full rounded-b-md border border-t-0 border-base-800 bg-base-950 px-4 py-3 text-neutral-100 outline-none prose prose-invert max-w-none",
      },
    },
  });

  if (!editor) {
    return null;
  }

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-base-800 bg-base-900 p-2">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          U
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          S
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          Left
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          Center
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          Right
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={editor.isActive("link")} onClick={setLink}>
          Link
        </ToolbarButton>

        <Divider />

        {COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => editor.chain().focus().setColor(color).run()}
            className="h-6 w-6 rounded-full border border-base-800"
            style={{ backgroundColor: color }}
            aria-label={`Set text color to ${color}`}
          />
        ))}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm font-medium ${
        active ? "brand-gradient-bg text-base-950" : "text-neutral-100 hover:bg-base-800"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-base-800" />;
}
