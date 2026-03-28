import "server-only";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import {
  DOCUMENT_CONTEXT_CHAR_LIMIT,
  SUPPORTED_DOCUMENT_TYPES,
} from "@/lib/constants";

const pdfWorkerUrl = pathToFileURL(
  path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.min.mjs",
  ),
).href;

PDFParse.setWorker(pdfWorkerUrl);

export function trimDocumentContext(text: string | null) {
  if (!text) {
    return null;
  }

  return text.trim().slice(0, DOCUMENT_CONTEXT_CHAR_LIMIT);
}

export async function extractDocumentText(file: File) {
  if (
    !SUPPORTED_DOCUMENT_TYPES.includes(
      file.type as (typeof SUPPORTED_DOCUMENT_TYPES)[number],
    )
  ) {
    return null;
  }

  if (file.type === "text/plain") {
    return trimDocumentContext(await file.text());
  }

  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });

    try {
      const parsed = await parser.getText();
      return trimDocumentContext(parsed.text);
    } finally {
      await parser.destroy();
    }
  }

  return null;
}
