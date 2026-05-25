import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { isPdfBuffer, unlockPdf } from "./pdfUtils.js";

export async function extractTextFromPdf(
  buffer: Buffer,
  pdfPassword?: string,
): Promise<string> {
  const pdfBuffer = isPdfBuffer(buffer) ? unlockPdf(buffer, pdfPassword) : buffer;
  const data = new Uint8Array(pdfBuffer);
  const pdf = await getDocument({ data, password: pdfPassword }).promise;

  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }
  return parts.join("\n");
}

/** Nama grup dokumen di Progress Penjualan — harus sama dengan client. */
export const KODE_BILLING_PPH_DOC_NAME = "Kode Billing PPh";

/**
 * Ekstrak kode billing DJP dari teks PDF billing PPh.
 * Contoh: KODE BILLING : 042079769810908
 */
export function extractKodeBillingFromText(text: string): string | null {
  if (!text?.trim()) return null;

  const labeled = text.match(/KODE\s*BILLING\s*:?\s*(\d{10,20})/i);
  if (labeled?.[1]) return labeled[1];

  const lines = text.split(/\r?\n/).map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (/K\s*O\s*D\s*E\s*B\s*I\s*L\s*L\s*I\s*N\s*G/i.test(lines[i]!)) {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const lineMatch = lines[j]!.match(/^(\d{10,20})$/);
        if (lineMatch?.[1]) return lineMatch[1];
      }
    }
  }

  const allFifteen = [...text.matchAll(/\b(\d{15})\b/g)].map((m) => m[1]!);
  if (allFifteen.length > 0) {
    return allFifteen[allFifteen.length - 1]!;
  }

  return null;
}
