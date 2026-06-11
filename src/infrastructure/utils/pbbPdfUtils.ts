import {
  extractTextFromPdf,
  isPdfLikelyScanned,
} from "./billingPphPdfUtils.js";
import { isPdfBuffer } from "./pdfUtils.js";
import type { GoogleVisionService } from "../external/GoogleVisionService.js";

/** NOPD SPPT PBB: digit, titik, strip (contoh 32.03.140.007.037-2439.0). */
const NOPD_LABELED_RE =
  /N\s*O\s*P\s*D\s*[:\)]?\s*:?\s*([0-9][0-9.\-]+)/gi;

export function normalizeNopd(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return null;

  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length < 10 || digitsOnly.length > 22) return null;
  if (/^\d{4}$/.test(trimmed)) return null;

  return trimmed;
}

/**
 * Ekstrak NOPD dari teks PDF SPPT PBB.
 * Dokumen biasanya punya 2 label NOPD (atas & bawah) dengan nilai sama.
 */
export function extractNopdFromText(text: string): string | null {
  if (!text?.trim()) return null;

  const candidates: string[] = [];

  for (const match of text.matchAll(NOPD_LABELED_RE)) {
    if (match[1]) candidates.push(match[1]);
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim());
  for (let i = 0; i < lines.length; i++) {
    if (!/N\s*O\s*P\s*D/i.test(lines[i]!)) continue;

    const inline = lines[i]!.match(
      /N\s*O\s*P\s*D\s*[:\)]?\s*:?\s*([0-9][0-9.\-]+)/i,
    );
    if (inline?.[1]) {
      candidates.push(inline[1]);
      continue;
    }

    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const next = lines[j]!;
      if (/^(TAHUN|NPWPD|LETAK|OBJEK|SPPT)/i.test(next)) break;
      const lineMatch = next.match(/^([0-9][0-9.\-]+)$/);
      if (lineMatch?.[1]) {
        candidates.push(lineMatch[1]);
        break;
      }
    }
  }

  const valid = candidates
    .map((candidate) => normalizeNopd(candidate))
    .filter((value): value is string => Boolean(value));

  if (valid.length === 0) return null;

  const counts = valid.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = [...new Set(valid)].sort(
    (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0),
  );
  return sorted[0] ?? null;
}

export async function extractNopdFromPbbPdfBuffer(
  fileBuffer: Buffer,
  googleVisionService: GoogleVisionService,
): Promise<string | null> {
  if (!isPdfBuffer(fileBuffer)) return null;

  let text = "";
  try {
    text = await extractTextFromPdf(fileBuffer);
  } catch {
    text = "";
  }

  let nopd = extractNopdFromText(text);

  if (!nopd || isPdfLikelyScanned(text)) {
    try {
      const ocrNopd =
        await googleVisionService.extractNopdFromPbbPdf(fileBuffer);
      nopd = ocrNopd ? normalizeNopd(ocrNopd) : nopd;
    } catch (error) {
      console.error("NOPD PBB OCR fallback error:", error);
    }
  }

  return nopd;
}
