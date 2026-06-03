import type { TagihanTujuan } from "@prisma/client";

const DP_KE_PATTERN = /^DP\s*(?:Cicilan\s*)?Ke-(\d+)$/i;
const CICILAN_DP_KE_PATTERN = /^Cicilan\s+DP\s+ke-(\d+)$/i;

export function dpNoTagihanPrefix(noTransaksi: string): string {
  return `INV-DP-${noTransaksi}`;
}

/** Urutan cicilan DP dari deskripsi pembayaran, jika ditulis eksplisit. */
export function parseDpSequenceFromPembayaran(pembayaran: string): number | null {
  const p = pembayaran.trim();
  const m = DP_KE_PATTERN.exec(p) ?? CICILAN_DP_KE_PATTERN.exec(p);
  return m ? parseInt(m[1]!, 10) : null;
}

/** Nomor tagihan DP: cicilan pertama tanpa suffix, berikutnya `-2`, `-3`, … */
export function buildDpNoTagihan(noTransaksi: string, sequence: number): string {
  const prefix = dpNoTagihanPrefix(noTransaksi);
  if (sequence <= 1) return prefix;
  return `${prefix}-${sequence}`;
}

/** Nomor urut berikutnya dari daftar tagihan DP yang sudah ada. */
export function getNextDpSequence(
  existingNoTagihans: string[],
  noTransaksi: string,
): number {
  const prefix = dpNoTagihanPrefix(noTransaksi);
  let max = 0;
  for (const no of existingNoTagihans) {
    if (no === prefix) {
      max = Math.max(max, 1);
      continue;
    }
    if (!no.startsWith(`${prefix}-`)) continue;
    const suffix = no.slice(prefix.length + 1);
    if (/^\d+$/.test(suffix)) {
      max = Math.max(max, parseInt(suffix, 10));
    }
  }
  return max + 1;
}

export function isLegacyCanonicalDpNoTagihan(
  noTagihan: string,
  noTransaksi: string,
): boolean {
  return noTagihan === dpNoTagihanPrefix(noTransaksi);
}

/**
 * Nomor tagihan kanonik per penjualan — selaras dengan penjualanRepo / UpdatePenjualanUseCase.
 * Untuk DP berkali-kali (cicilan), gunakan {@link resolveDpNoTagihanForCreate}.
 */
export function buildNoTagihanForCreate(args: {
  noTransaksi: string;
  tujuan: TagihanTujuan;
  pembayaran: string;
}): string {
  const { noTransaksi, tujuan, pembayaran } = args;

  switch (tujuan) {
    case "BOOKING_FEE":
      return `INV-BF-${noTransaksi}`;
    case "DP": {
      const seq = parseDpSequenceFromPembayaran(pembayaran);
      return buildDpNoTagihan(noTransaksi, seq ?? 1);
    }
    case "HARGA_JUAL": {
      const m = /^Cicilan Ke-(\d+)$/i.exec(pembayaran.trim());
      if (m) {
        return `INV-CCL-${noTransaksi}-${m[1]}`;
      }
      return `INV-CCL-${noTransaksi}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
    }
    case "LAINNYA":
    default:
      return `INV-ADD-${noTransaksi}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
  }
}

export function resolveDpNoTagihanForCreate(args: {
  noTransaksi: string;
  pembayaran: string;
  existingDpNoTagihans: string[];
}): string {
  const explicit = parseDpSequenceFromPembayaran(args.pembayaran);
  if (explicit != null) {
    return buildDpNoTagihan(args.noTransaksi, explicit);
  }
  const next = getNextDpSequence(args.existingDpNoTagihans, args.noTransaksi);
  return buildDpNoTagihan(args.noTransaksi, next);
}

export function duplicateNoTagihanMessage(
  noTagihan: string,
  tujuan: TagihanTujuan,
): string {
  switch (tujuan) {
    case "BOOKING_FEE":
      return `Tagihan booking fee untuk transaksi ini sudah ada (${noTagihan}).`;
    case "DP":
      return `Tagihan down payment dengan nomor ${noTagihan} sudah terdaftar untuk transaksi ini.`;
    case "HARGA_JUAL":
      return `Tagihan cicilan dengan nomor ${noTagihan} sudah terdaftar untuk transaksi ini.`;
    default:
      return `Nomor tagihan ${noTagihan} sudah terdaftar.`;
  }
}
