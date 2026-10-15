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

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 40;

async function importFromCdn<T>(url: string): Promise<T> {
  // These parsers run in the browser so uploaded resume files are not sent to our server.
  return (await import(/* @vite-ignore */ url)) as T;
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
    const mammoth = await importFromCdn<MammothModule>(
      "https://esm.sh/mammoth@1.9.0?bundle",
    );
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  }

  if (extension === "pdf") {
    const pdfjs = await importFromCdn<PdfJsModule>(
      "https://esm.sh/pdfjs-dist@4.10.38/legacy/build/pdf.mjs?bundle",
    );
    pdfjs.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.mjs";
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
