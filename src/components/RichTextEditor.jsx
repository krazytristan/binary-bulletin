import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Video,
  Eye,
  Edit3,
} from "lucide-react";
import { parseArticleBlocks } from "../utils/editorial";

/**
 * Newsroom Rich-Text / Editorial Markdown Editor with live preview and Media Library insertion.
 */
export default function RichTextEditor({
  value = "",
  onChange,
  onOpenMediaPicker,
  placeholder = "Write the story here...",
  rows = 14,
}) {
  const textareaRef = useRef(null);
  const [mode, setMode] = useState("write"); // write | preview

  const wrapSelection = (prefix, suffix = "", defaultText = "text") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || defaultText;
    const nextValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(nextValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const insertLinePrefix = (prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const selected = value.slice(lineStart, end) || "Section Heading";
    const formatted = selected
      .split("\n")
      .map((line) => `${prefix}${line.replace(/^#{1,3}\s+|^[-•>]\s+|^\d+\.\s+/, "")}`)
      .join("\n");
    const nextValue = value.slice(0, lineStart) + formatted + value.slice(end);
    onChange(nextValue);

    setTimeout(() => {
      el.focus();
    }, 0);
  };

  const handleInsertLink = () => {
    const url = window.prompt("Enter link URL (https://...):");
    if (!url) return;
    wrapSelection("[", `](${url})`, "link text");
  };

  const handleInsertImageUrl = () => {
    if (onOpenMediaPicker) {
      onOpenMediaPicker((url, caption) => {
        const snippet = `\n\n![${caption || "Editorial image"}](${url})\n\n`;
        onChange((value || "") + snippet);
      });
      return;
    }
    const url = window.prompt("Enter image URL:");
    if (!url) return;
    const snippet = `\n\n![Editorial photo](${url})\n\n`;
    onChange((value || "") + snippet);
  };

  const handleInsertMediaEmbed = () => {
    const url = window.prompt("Enter YouTube or media URL to embed:");
    if (!url) return;
    const snippet = `\n\n[Embedded Media: ${url}](${url})\n\n`;
    onChange((value || "") + snippet);
  };

  const wordCount = (value || "").trim().split(/\s+/).filter(Boolean).length;
  const previewBlocks = parseArticleBlocks(value || "");

  return (
    <div className="border border-gray-300 bg-white">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-300">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => insertLinePrefix("## ")}
            title="Section Heading (H2)"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <Heading2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix("### ")}
            title="Subheading (H3)"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <Heading3 size={15} />
          </button>
          <span className="w-px h-4 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => wrapSelection("**", "**", "bold text")}
            title="Bold"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection("*", "*", "italic text")}
            title="Italic"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix("> ")}
            title="Blockquote"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <Quote size={15} />
          </button>
          <span className="w-px h-4 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => insertLinePrefix("- ")}
            title="Bullet List"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix("1. ")}
            title="Numbered List"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <ListOrdered size={15} />
          </button>
          <span className="w-px h-4 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={handleInsertLink}
            title="Insert Hyperlink"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <Link2 size={15} />
          </button>
          <button
            type="button"
            onClick={handleInsertImageUrl}
            title="Insert Image"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <ImageIcon size={15} />
          </button>
          <button
            type="button"
            onClick={handleInsertMediaEmbed}
            title="Embed Video / Media"
            className="p-1.5 text-gray-700 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <Video size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-500 mr-2">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
              mode === "write" ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Edit3 size={12} /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
              mode === "preview" ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Eye size={12} /> Preview
          </button>
        </div>
      </div>

      {/* BODY */}
      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 bg-white font-serif text-base text-gray-900 leading-relaxed outline-none resize-y"
        />
      ) : (
        <div className="p-6 min-h-[260px] max-h-[420px] overflow-y-auto font-serif text-gray-800 space-y-4 bg-[#FCFBF9]">
          {previewBlocks.length === 0 ? (
            <p className="italic text-gray-400">Nothing written yet.</p>
          ) : (
            previewBlocks.map((b, i) =>
              b.type === "heading" ? (
                <h3
                  key={i}
                  className="text-xl font-bold text-blue-900 border-l-4 border-amber-400 pl-3 pt-2"
                >
                  {b.text}
                </h3>
              ) : b.type === "bullet" ? (
                <div key={i} className="flex items-start gap-2.5 pl-2">
                  <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-red-900 shrink-0" />
                  <p>{b.text}</p>
                </div>
              ) : (
                <p key={i} className="leading-relaxed">
                  {b.text}
                </p>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}
