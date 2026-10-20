type PdfTextItem = { str?: string };
type PdfPage = { getTextContent(): Promise<{ items: PdfTextItem[] }> };
type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  destroy?: () => Promise<void>;
};
type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(options: {
    data: Uint8Array;
    isEvalSupported: boolean;
  }): { promise: Promise<PdfDocument> };
};
type MammothModule = {
  extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
};

declare global {
  interface Window {
    pdfjsLib?: PdfJsModule;
  }
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 40;
const PDFJS_VERSION = "3.11.174";

let pdfJsScriptPromise: Promise<PdfJsModule> | undefined;

function loadPdfJs(): Promise<PdfJsModule> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF reading is only available in the browser."));
  }
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfJsScriptPromise) return pdfJsScriptPromise;

  pdfJsScriptPromise = new Promise<PdfJsModule>((resolve, reject) => {
    const sources = [
      {
        script: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.min.js`,
        worker: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.js`,
      },
      {
        script: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.min.js`,
        worker: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.js`,
      },
    ];
    let index = 0;

    const tryNext = () => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      if (index >= sources.length) {
        pdfJsScriptPromise = undefined;
        reject(
          new Error(
            "The PDF reader couldn't be downloaded. Check your connection or browser content blockers, then try again.",
          ),
        );
        return;
      }

      const source = sources[index++];
      const script = document.createElement("script");
      script.src = source.script;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = source.worker;
          resolve(window.pdfjsLib);
        } else {
          tryNext();
        }
      };
      script.onerror = tryNext;
      document.head.appendChild(script);
    };

    tryNext();
  });

  return pdfJsScriptPromise;
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

export async function extractResumeText(file: File): Promise<string> {
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
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  }

  if (extension === "pdf") {
    const pdfjs = await loadPdfJs();
    const document = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
    }).promise;

    try {
      if (document.numPages > MAX_PDF_PAGES) {
        throw new Error(
          `This PDF has ${document.numPages} pages. Please upload a resume of ${MAX_PDF_PAGES} pages or fewer.`,
        );
      }

      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str ?? "").join(" "));
      }
      return pages.join("\n\n");
    } finally {
      await document.destroy?.();
    }
  }

  throw new Error(
    "Please choose a PDF or Word .docx file. You can also paste resume text into the editor below.",
  );
}
