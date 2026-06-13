import type { PaymentStatus } from "@prisma/client";

/** Tagihan lunas tidak boleh diubah nominalnya dari sync penjualan/cicilan. */
export function isTagihanNominalLocked(status: PaymentStatus): boolean {
  return status === "LUNAS";
}
