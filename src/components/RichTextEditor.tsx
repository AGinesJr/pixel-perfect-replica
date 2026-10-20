import { useEffect, useRef, type ClipboardEvent } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";

type RichTextEditorProps = {
  value: string;
  htmlValue: string;
  onChange: (text: string) => void;
  onHtmlChange: (html: string) => void;
  label: string;
  placeholder: string;
  minHeightClass?: string;
};

const ALLOWED_TAGS = new Set([
  "P", "DIV", "BR", "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI",
  "H1", "H2", "H3", "BLOCKQUOTE", "A", "SPAN",
]);

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    if (!(node instanceof HTMLElement)) return null;
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "META", "LINK"].includes(node.tagName)) return null;
    if (!ALLOWED_TAGS.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      [...node.childNodes].forEach((child) => {
        const cleaned = cleanNode(child);
        if (cleaned) fragment.appendChild(cleaned);
      });
      return fragment;
    }
    const clean = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      if (/^(https?:|mailto:)/i.test(href)) clean.setAttribute("href", href);
      clean.setAttribute("rel", "noopener noreferrer");
      clean.setAttribute("target", "_blank");
    }
    [...node.childNodes].forEach((child) => {
      const cleaned = cleanNode(child);
      if (cleaned) clean.appendChild(cleaned);
    });
    const style = node.getAttribute("style") ?? "";
    let result: Node = clean;
    const wrappers: string[] = [];
    if (style.includes("bold") || /font-weight:\s*[6-9]00/i.test(style)) wrappers.push("strong");
    if (style.includes("italic")) wrappers.push("em");
    if (style.includes("underline")) wrappers.push("u");
    for (const tag of wrappers) {
      const wrapper = document.createElement(tag);
      wrapper.appendChild(result);
      result = wrapper;
    }
    return result;
  };
  const output = document.createElement("div");
  [...parsed.body.childNodes].forEach((node) => {
    const cleaned = cleanNode(node);
    if (cleaned) output.appendChild(cleaned);
  });
  return output.innerHTML;
}

export function plainTextFromRichTextHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ");
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return (parsed.body.innerText || parsed.body.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlFromText(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trim() ? `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "<p><br></p>")
    .join("");
}

export function sanitizeRichTextHtml(html: string): string {
  return sanitizeHtml(html);
}

export function RichTextEditor({
  value,
  htmlValue,
  onChange,
  onHtmlChange,
  label,
  placeholder,
  minHeightClass = "min-h-56",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastValueRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(htmlValue || htmlFromText(value));
      lastValueRef.current = value;
    } else if (!editorRef.current.innerHTML && (htmlValue || value)) {
      editorRef.current.innerHTML = sanitizeHtml(htmlValue || htmlFromText(value));
    }
  }, [value, htmlValue]);

  function publishHtml(rawHtml: string) {
    const clean = sanitizeHtml(rawHtml);
    const text = plainTextFromRichTextHtml(clean);
    if (editorRef.current && editorRef.current.innerHTML !== clean) {
      editorRef.current.innerHTML = clean;
    }
    lastValueRef.current = text;
    onHtmlChange(clean);
    onChange(text);
  }

  function format(command: "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList") {
    editorRef.current?.focus();
    document.execCommand(command, false);
    if (editorRef.current) publishHtml(editorRef.current.innerHTML);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const plain = event.clipboardData.getData("text/plain");
    const safe = html ? sanitizeHtml(html) : htmlFromText(plain);
    document.execCommand("insertHTML", false, safe);
    if (editorRef.current) publishHtml(editorRef.current.innerHTML);
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
      <div role="toolbar" aria-label={`${label} formatting`} className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
        <button type="button" aria-label="Bold" title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")} className="grid h-8 w-8 place-items-center rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Bold className="h-4 w-4" /></button>
        <button type="button" aria-label="Italic" title="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => format("italic")} className="grid h-8 w-8 place-items-center rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Italic className="h-4 w-4" /></button>
        <button type="button" aria-label="Underline" title="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")} className="grid h-8 w-8 place-items-center rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Underline className="h-4 w-4" /></button>
        <span className="mx-1 h-5 border-l" aria-hidden="true" />
        <button type="button" aria-label="Bulleted list" title="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertUnorderedList")} className="grid h-8 w-8 place-items-center rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><List className="h-4 w-4" /></button>
        <button type="button" aria-label="Numbered list" title="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => format("insertOrderedList")} className="grid h-8 w-8 place-items-center rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ListOrdered className="h-4 w-4" /></button>
        <span className="ml-auto text-xs text-muted-foreground">Formatting is kept when you paste rich text</span>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) => publishHtml(event.currentTarget.innerHTML)}
        onPaste={handlePaste}
        className={`${minHeightClass} max-h-[36rem] overflow-y-auto px-3 py-3 text-sm leading-6 outline-none [&_a]:text-primary [&_a]:underline [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-2 [&_ul]:mb-2`}
      />
      <style>{`[data-placeholder]:empty::before { content: attr(data-placeholder); color: hsl(var(--muted-foreground)); pointer-events: none; }`}</style>
    </div>
  );
}
