import type { TagihanTujuan } from "@prisma/client";

/** Label singkat untuk UI & pencarian */
export const TAGIHAN_TUJUAN_LABEL: Record<TagihanTujuan, string> = {
  BOOKING_FEE: "Booking fee",
  DP: "Down payment (uang muka)",
  HARGA_JUAL: "Cicilan harga jual",
  LAINNYA: "Biaya / lainnya",
};

/**
 * Inferensi untuk data lama / klien yang belum mengirim `tujuan`.
 * Jangan mengandalkan ini untuk logika finansial kritis setelah migrasi;
 * gunakan kolom `tujuan` dari DB.
 */
export function inferTagihanTujuanFromPembayaran(
  pembayaran: string,
): TagihanTujuan {
  const p = pembayaran.trim().toLowerCase();
  if (p.includes("booking")) return "BOOKING_FEE";
  if (/^cicilan ke-\d+$/.test(p)) return "HARGA_JUAL";
  if (
    p.includes("down payment") ||
    p.includes("uang muka") ||
    (p.includes("dp") && !p.includes("booking"))
  ) {
    return "DP";
  }
  return "LAINNYA";
}

export function effectiveTagihanTujuan(tagihan: {
  tujuan?: TagihanTujuan | null;
  pembayaran: string;
}): TagihanTujuan {
  if (tagihan.tujuan != null && tagihan.tujuan !== "LAINNYA") {
    return tagihan.tujuan;
  }
  return inferTagihanTujuanFromPembayaran(tagihan.pembayaran);
}

export function isCicilanHargaJualTagihan(tagihan: {
  tujuan?: TagihanTujuan | null;
  pembayaran: string;
}): boolean {
  return effectiveTagihanTujuan(tagihan) === "HARGA_JUAL";
}
