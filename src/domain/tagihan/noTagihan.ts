import type { TagihanTujuan } from "@prisma/client";

/**
 * Nomor tagihan kanonik per penjualan — selaras dengan penjualanRepo / UpdatePenjualanUseCase.
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
    case "DP":
      return `INV-DP-${noTransaksi}`;
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

export function duplicateNoTagihanMessage(
  noTagihan: string,
  tujuan: TagihanTujuan,
): string {
  switch (tujuan) {
    case "BOOKING_FEE":
      return `Tagihan booking fee untuk transaksi ini sudah ada (${noTagihan}).`;
    case "DP":
      return `Tagihan down payment untuk transaksi ini sudah ada (${noTagihan}).`;
    case "HARGA_JUAL":
      return `Tagihan cicilan dengan nomor ${noTagihan} sudah terdaftar untuk transaksi ini.`;
    default:
      return `Nomor tagihan ${noTagihan} sudah terdaftar.`;
  }
}
