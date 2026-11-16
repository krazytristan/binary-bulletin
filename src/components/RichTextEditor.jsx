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
import SmartImage from "./SmartImage";

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
    <div className="border border-gray-300 bg-white rounded-lg overflow-hidden">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2.5 sm:px-3 py-2 bg-gray-50 border-b border-gray-300">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => insertLinePrefix("## ")}
            title="Section Heading (H2)"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <Heading2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix("### ")}
            title="Subheading (H3)"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <Heading3 size={15} />
          </button>
          <span className="w-px h-4 bg-gray-300 mx-0.5 sm:mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => wrapSelection("**", "**", "bold text")}
            title="Bold"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection("*", "*", "italic text")}
            title="Italic"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix("> ")}
            title="Blockquote"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <Quote size={15} />
          </button>
          <span className="w-px h-4 bg-gray-300 mx-0.5 sm:mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => insertLinePrefix("- ")}
            title="Bullet List"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix("1. ")}
            title="Numbered List"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <ListOrdered size={15} />
          </button>
          <span className="w-px h-4 bg-gray-300 mx-0.5 sm:mx-1 shrink-0" />
          <button
            type="button"
            onClick={handleInsertLink}
            title="Insert Hyperlink"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <Link2 size={15} />
          </button>
          <button
            type="button"
            onClick={handleInsertImageUrl}
            title="Insert Image"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <ImageIcon size={15} />
          </button>
          <button
            type="button"
            onClick={handleInsertMediaEmbed}
            title="Embed Video / Media"
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 flex items-center justify-center rounded text-gray-700 hover:bg-blue-900 hover:text-white transition-colors shrink-0"
          >
            <Video size={15} />
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-gray-200 pt-2 sm:pt-0">
          <span className="text-[11px] font-semibold text-gray-500">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={`inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 px-3 py-1.5 sm:py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                mode === "write" ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Edit3 size={12} /> Write
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 px-3 py-1.5 sm:py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                mode === "preview" ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Eye size={12} /> Preview
            </button>
          </div>
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
          className="w-full p-3.5 sm:p-4 bg-white font-serif text-base text-gray-900 leading-relaxed outline-none resize-y"
        />
      ) : (
        <div className="p-4 sm:p-6 min-h-[260px] max-h-[420px] overflow-y-auto font-serif text-gray-800 space-y-4 bg-[#FCFBF9]">
          {previewBlocks.length === 0 ? (
            <p className="italic text-gray-400">Nothing written yet.</p>
          ) : (
            previewBlocks.map((b, i) =>
              b.type === "heading" ? (
                <h3
                  key={i}
                  className="text-lg sm:text-xl font-bold text-blue-900 border-l-4 border-amber-400 pl-3 pt-2"
                >
                  {b.text}
                </h3>
              ) : b.type === "quote" ? (
                <blockquote
                  key={i}
                  className="border-l-4 border-red-900 pl-4 italic text-gray-700 bg-white py-2 pr-3"
                >
                  {b.text}
                </blockquote>
              ) : b.type === "image" ? (
                <figure key={i} className="my-2">
                  <SmartImage
                    src={b.url}
                    alt={b.alt || "Embedded visual"}
                    mode="inline"
                    fit="contain"
                    containerClassName="border border-gray-200 rounded"
                    className="max-h-72"
                  />
                  {b.alt && (
                    <figcaption className="text-[11px] italic text-gray-500 mt-1 text-right">
                      {b.alt}
                    </figcaption>
                  )}
                </figure>
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
