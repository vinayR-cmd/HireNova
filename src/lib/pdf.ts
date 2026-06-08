import { PDFParse } from "pdf-parse";

declare global {
  // eslint-disable-next-line no-var
  var pdfjsWorker: unknown;
}

// pdfjs-dist (used internally by pdf-parse) tries to dynamically import its
// worker bundle at runtime. That file doesn't exist in Next.js's bundled server
// output, which crashes with "Setting up fake worker failed". Pre-registering
// the worker's message handler on globalThis short-circuits that dynamic import
// — this is the standard Node.js workaround for pdfjs-dist.
let workerReady: Promise<void> | null = null;
function ensurePdfWorker(): Promise<void> {
  if (!workerReady) {
    workerReady = import("pdfjs-dist/legacy/build/pdf.worker.mjs").then((mod) => {
      globalThis.pdfjsWorker = mod;
    });
  }
  return workerReady;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  await ensurePdfWorker();
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
