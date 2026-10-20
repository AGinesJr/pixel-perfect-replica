import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
  hasEOL?: boolean;
};
type PdfTextStyle = { fontFamily?: string; ascent?: number; descent?: number };
type PdfPage = { getTextContent(): Promise<{ items: PdfTextItem[]; styles?: Record<string, PdfTextStyle> }> };
type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  destroy?: () => Promise<void>;
};
type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(options: { data: Uint8Array; isEvalSupported: boolean }): { promise: Promise<PdfDocument> };
};
type MammothModule = {
  extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
};

export type ExtractedResumeContent = { text: string; html: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 40;
let pdfJsModulePromise: Promise<PdfJsModule> | undefined;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs")
      .then((module) => {
        module.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        return module as unknown as PdfJsModule;
      })
      .catch((error: unknown) => {
        pdfJsModulePromise = undefined;
        const detail = error instanceof Error ? error.message : "";
        throw new Error(`The bundled PDF reader could not be initialized. Please refresh the page and try again. ${detail}`);
      });
  }
  return pdfJsModulePromise;
}

async function importFromCdn<T>(urls: string[]): Promise<T> {
  // Parsers run in the browser so uploaded resume files are not sent to our server.
  let lastError: unknown;
  for (const url of urls) {
    try {
      return (await import(/* @vite-ignore */ url)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? new Error(`The file parser could not be loaded. Please refresh the page and try again. (${lastError.message})`)
    : new Error("The file parser could not be loaded. Please refresh the page and try again.");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type PositionedItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  bold: boolean;
  italic: boolean;
};

type ResumeLine = { items: PositionedItem[]; y: number; fontSize: number; bold: boolean; text: string };

function lineHtml(line: ResumeLine): string {
  let previous: PositionedItem | undefined;
  const content = line.items.map((item) => {
    const gap = previous ? item.x - (previous.x + previous.width) : 0;
    const separator = previous && gap > Math.max(1.5, item.fontSize * 0.12) &&
      !/\\s$/.test(previous.text) && !/^\\s/.test(item.text) ? " " : "";
    previous = item;
    const text = separator + escapeHtml(item.text);
    if (item.bold && item.italic) return `<strong><em>${text}</em></strong>`;
    if (item.bold) return `<strong>${text}</strong>`;
    if (item.italic) return `<em>${text}</em>`;
    return text;
  }).join("");
  const cleanText = line.text.trim();
  if (!cleanText) return "";
  if (/^(?:[•●▪◦‣⁃–—-])\s+/.test(cleanText)) {
    return `<li>${content.replace(/^\s*(?:[•●▪◦‣⁃–—-])\s*/, "")}</li>`;
  }
  if (/^\d{1,2}[.)]\s+/.test(cleanText)) {
    return `<li>${content.replace(/^\s*\d{1,2}[.)]\s*/, "")}</li>`;
  }
  const looksLikeHeading = cleanText.length <= 64 &&
    (line.fontSize >= 13 || (line.bold && cleanText === cleanText.toLocaleUpperCase() && /[A-Z]/.test(cleanText)));
  if (looksLikeHeading) return `<h2>${content}</h2>`;
  return `<p>${content}</p>`;
}

function renderPdfPage(items: PdfTextItem[], styles: Record<string, PdfTextStyle> = {}): { text: string; html: string } {
  const positioned: PositionedItem[] = items
    .filter((item) => typeof item.str === "string" && item.str.length > 0 && item.transform?.length === 6)
    .map((item) => {
      const transform = item.transform!;
      const fontName = item.fontName ?? "";
      const family = styles[fontName]?.fontFamily ?? "";
      const fontSize = Math.max(1, Math.hypot(transform[0], transform[1]));
      return {
        text: item.str ?? "",
        x: transform[4],
        y: transform[5],
        width: Math.max(0, item.width ?? 0),
        fontSize,
        bold: /bold|black|heavy|semibold|demi/i.test(fontName + " " + family),
        italic: /italic|oblique/i.test(fontName + " " + family),
      };
    })
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: ResumeLine[] = [];
  for (const item of positioned) {
    let line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= Math.max(2.5, item.fontSize * 0.22));
    if (!line) {
      line = { items: [], y: item.y, fontSize: item.fontSize, bold: item.bold, text: "" };
      lines.push(line);
    }
    line.items.push(item);
    line.fontSize = Math.max(line.fontSize, item.fontSize);
    line.bold ||= item.bold;
  }

  lines.sort((a, b) => b.y - a.y);
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    let previous: PositionedItem | undefined;
    let text = "";
    for (const item of line.items) {
      if (previous) {
        const gap = item.x - (previous.x + previous.width);
        if (gap > Math.max(1.5, item.fontSize * 0.12) && !/\s$/.test(text) && !/^\s/.test(item.text)) text += " ";
      }
      text += item.text;
      previous = item;
    }
    line.text = text.replace(/\s+/g, " ").trim();
  }

  const blocks: string[] = [];
  let listItems: string[] = [];
  const flushList = () => {
    if (listItems.length) blocks.push(`<ul>${listItems.join("")}</ul>`);
    listItems = [];
  };
  for (const line of lines) {
    if (!line.text) continue;
    const html = lineHtml(line);
    if (html.startsWith("<li>")) listItems.push(html);
    else {
      flushList();
      blocks.push(html);
    }
  }
  flushList();
  return {
    text: lines.map((line) => line.text).filter(Boolean).join("\n"),
    html: blocks.join(""),
  };
}

function plainTextHtml(text: string): string {
  return text.split(/\n{2,}/).map((paragraph) => {
    const safe = escapeHtml(paragraph).replace(/\n/g, "<br>");
    return `<p>${safe || "<br>"}</p>`;
  }).join("");
}

export async function extractResumeContent(file: File): Promise<ExtractedResumeContent> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That file is larger than 10 MB. Please upload a smaller resume file.");
  }

  if (extension === "doc") {
    throw new Error(
      "Legacy Word .doc files aren't supported yet. Open the file in Word and save it as .docx, or export it as PDF, then upload it again.",
    );
  }

  if (extension === "docx") {
    const mammoth = await importFromCdn<MammothModule>([
      "https://cdn.jsdelivr.net/npm/mammoth@1.9.0/+esm",
      "https://esm.sh/mammoth@1.9.0?bundle",
    ]);
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { text: result.value, html: plainTextHtml(result.value) };
  }

  if (extension === "pdf") {
    const pdfjs = await loadPdfJs();
    const document = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
    }).promise;

    try {
      if (document.numPages > MAX_PDF_PAGES) {
        throw new Error(`This PDF has ${document.numPages} pages. Please upload a resume of ${MAX_PDF_PAGES} pages or fewer.`);
      }

      const pages: string[] = [];
      const htmlPages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const rendered = renderPdfPage(content.items, content.styles);
        pages.push(rendered.text);
        htmlPages.push(rendered.html);
      }
      return { text: pages.join("\n\n"), html: htmlPages.join("<p><br></p>") };
    } finally {
      await document.destroy?.();
    }
  }

  throw new Error("Please choose a PDF or Word .docx file. You can also paste resume text into the editor below.");
}

/** Backwards-compatible plain-text API for other callers. */
export async function extractResumeText(file: File): Promise<string> {
  return (await extractResumeContent(file)).text;
}
