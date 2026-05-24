export type SprPembayaranAwalRow = {
  keterangan: string;
  jatuhTempo: Date;
  nominal: number;
};

type PenjualanSprSource = {
  tanggal: Date;
  caraPembayaran?: string | null;
  bookingFee?: unknown;
  dp?: unknown;
  dpDibayar?: unknown;
  dpTidakDibayar?: unknown;
};

const toAmount = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * DP efektif untuk SPR: dpDibayar jika ada, selain itu dpTidakDibayar atau kolom dp.
 */
export function resolveEffectiveDpForSpr(
  penjualan: Pick<
    PenjualanSprSource,
    "dpDibayar" | "dpTidakDibayar" | "dp"
  >,
): number {
  const dpDibayar = toAmount(penjualan.dpDibayar);
  if (dpDibayar > 0) return dpDibayar;

  const dpTidakDibayar = toAmount(penjualan.dpTidakDibayar);
  if (dpTidakDibayar > 0) return dpTidakDibayar;

  return toAmount(penjualan.dp);
}

export function buildSprPembayaranAwalRows(
  penjualan: PenjualanSprSource,
): SprPembayaranAwalRow[] {
  const rows: SprPembayaranAwalRow[] = [];
  const tanggal = new Date(penjualan.tanggal);

  const bookingFee = toAmount(penjualan.bookingFee);
  if (bookingFee > 0) {
    rows.push({
      keterangan: "Booking Fee",
      jatuhTempo: tanggal,
      nominal: bookingFee,
    });
  }

  const caraPembayaran = penjualan.caraPembayaran ?? "";
  const showDp =
    caraPembayaran === "KPR" || caraPembayaran === "CASH_BERTAHAP";

  if (showDp) {
    const dpNominal = resolveEffectiveDpForSpr(penjualan);
    if (dpNominal > 0) {
      const dpDueDate = new Date(tanggal);
      dpDueDate.setDate(dpDueDate.getDate() + 14);

      rows.push({
        keterangan: "Down Payment (DP)",
        jatuhTempo: dpDueDate,
        nominal: dpNominal,
      });
    }
  }

  return rows;
}
