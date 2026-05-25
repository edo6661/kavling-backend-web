import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api.js";
import { isPdfBuffer, unlockPdf } from "./pdfUtils.js";

const KODE_BILLING_LABELED_RE =
  /KODE\s*BILLING\s*:?\s*(\d{10,20})/gi;
const KODE_BILLING_HEADING_RE =
  /K\s*O\s*D\s*E\s*B\s*I\s*L\s*L\s*I\s*N\s*G/i;
const FIFTEEN_DIGIT_RE = /\b(\d{15})\b/g;
/** DJP kode billing umumnya 15 digit; NPWP 16 digit — hindari salah ambil. */
const PREFERRED_BILLING_LENGTH = 15;

type TextContentItem = TextItem | { str?: string; transform?: number[] };

function isTextItem(item: TextContentItem): item is TextItem {
  return "str" in item && typeof item.str === "string" && item.str.length > 0;
}

/** Urutkan fragmen teks PDF seperti urutan baca manusia (atas→bawah, kiri→kanan). */
function sortTextItemsByReadingOrder(items: TextContentItem[]): TextItem[] {
  const textItems = items.filter(isTextItem);
  return textItems.sort((a, b) => {
    const tyA = a.transform[5] ?? 0;
    const tyB = b.transform[5] ?? 0;
    if (Math.abs(tyA - tyB) > 4) return tyB - tyA;
    return (a.transform[4] ?? 0) - (b.transform[4] ?? 0);
  });
}

function pageItemsToText(items: TextContentItem[]): string {
  const sorted = sortTextItemsByReadingOrder(items);
  const lines: string[] = [];
  let currentLine = "";
  let lastTy: number | null = null;

  for (const item of sorted) {
    const ty = item.transform[5] ?? 0;
    if (lastTy !== null && Math.abs(ty - lastTy) > 4) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = item.str;
    } else {
      currentLine = currentLine ? `${currentLine} ${item.str}` : item.str;
    }
    lastTy = ty;
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines.join("\n");
}

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
    parts.push(pageItemsToText(content.items as TextContentItem[]));
  }
  return parts.join("\n");
}

/** Nama grup dokumen di Progress Penjualan — harus sama dengan client. */
export const KODE_BILLING_PPH_DOC_NAME = "Kode Billing PPh";

function scoreBillingCandidate(digits: string): number {
  let score = 0;
  if (digits.length === PREFERRED_BILLING_LENGTH) score += 10;
  else if (digits.length >= 10 && digits.length <= 20) score += 3;
  if (digits.startsWith("0")) score += 2;
  return score;
}

function pickBestCandidate(candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  const unique = [...new Set(candidates)];
  unique.sort((a, b) => scoreBillingCandidate(b) - scoreBillingCandidate(a));
  return unique[0] ?? null;
}

/**
 * Ekstrak kode billing DJP dari teks PDF billing PPh.
 * Mendukung format lama (KODE BILLING + angka terpisah) dan format baru (K O D E B I L L I N G).
 */
export function extractKodeBillingFromText(text: string): string | null {
  if (!text?.trim()) return null;

  const candidates: string[] = [];

  for (const match of text.matchAll(KODE_BILLING_LABELED_RE)) {
    if (match[1]) candidates.push(match[1]);
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (!KODE_BILLING_HEADING_RE.test(lines[i]!)) continue;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const line = lines[j]!;
      if (/^DETAIL\s*BILLING/i.test(line)) break;
      const lineMatch = line.match(/^(\d{10,20})$/);
      if (lineMatch?.[1]) {
        candidates.push(lineMatch[1]);
        break;
      }
    }
  }

  for (const match of text.matchAll(
    /KODE\s*BILLING[\s\S]{0,160}?(\d{15})/gi,
  )) {
    if (match[1]) candidates.push(match[1]);
  }

  for (const match of text.matchAll(FIFTEEN_DIGIT_RE)) {
    candidates.push(match[1]!);
  }

  const labeled = [...text.matchAll(KODE_BILLING_LABELED_RE)]
    .map((m) => m[1])
    .filter((c): c is string => Boolean(c));
  if (labeled.length > 0) {
    return pickBestCandidate(labeled);
  }

  const gunakanIdx = text.toUpperCase().lastIndexOf("GUNAKAN KODE BILLING");
  if (gunakanIdx >= 0) {
    const afterFooter = candidates.filter(
      (c) => text.lastIndexOf(c) >= gunakanIdx,
    );
    if (afterFooter.length > 0) {
      return pickBestCandidate(afterFooter);
    }
  }

  return pickBestCandidate(candidates);
}

/** PDF scan sering hampir tanpa text layer yang terbaca pdf.js. */
export function isPdfLikelyScanned(text: string): boolean {
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 80) return true;
  const digitCount = (text.match(/\d/g) ?? []).length;
  return digitCount < 15;
}
