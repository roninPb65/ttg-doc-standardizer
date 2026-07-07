/**
 * extract.ts
 * ----------
 * Turns an uploaded file (any supported format) into plain text so the
 * structuring stage can work format-agnostically. Mirrors the coverage of the
 * existing summary-generator / excel-summary-generator skills:
 *   - .docx            -> mammoth
 *   - .pdf             -> pdf-parse
 *   - .xlsx/.xls/.csv  -> SheetJS (every tab, in tab order)
 *   - .txt/.md/others  -> utf-8 text
 */

import mammoth from "mammoth";
import * as XLSX from "xlsx";

// pdf-parse ships as CommonJS with a debug side-effect on import; require lazily.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (b: Buffer) => Promise<{ text: string }> = require("pdf-parse");

export interface ExtractResult {
  text: string;
  detectedType: string;
}

function ext(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { text } = await pdfParse(buffer);
  return text;
}

function extractSpreadsheet(buffer: Buffer): string {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  // Tab order is the order SheetNames is given by the file (left-to-right).
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim().length === 0) {
      parts.push(`--- Tab: ${name} (empty) ---`);
    } else {
      parts.push(`--- Tab: ${name} ---\n${csv}`);
    }
  }
  return parts.join("\n\n");
}

export async function extractContent(
  buffer: Buffer,
  filename: string
): Promise<ExtractResult> {
  const e = ext(filename);
  switch (e) {
    case "docx":
      return { text: await extractDocx(buffer), detectedType: "docx" };
    case "pdf":
      return { text: await extractPdf(buffer), detectedType: "pdf" };
    case "xlsx":
    case "xlsm":
    case "xls":
    case "csv":
    case "tsv":
      return { text: extractSpreadsheet(buffer), detectedType: e };
    case "txt":
    case "md":
    case "markdown":
    case "json":
      return { text: buffer.toString("utf-8"), detectedType: e || "txt" };
    default:
      // Best-effort: treat unknown types as utf-8 text.
      return { text: buffer.toString("utf-8"), detectedType: e || "unknown" };
  }
}

export const SUPPORTED_EXTENSIONS = [
  "docx",
  "pdf",
  "xlsx",
  "xlsm",
  "xls",
  "csv",
  "tsv",
  "txt",
  "md",
  "markdown",
  "json",
];
