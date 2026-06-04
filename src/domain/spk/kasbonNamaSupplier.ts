/** Nama supplier pada bon tanpa header toko (diisi ke DB & tampilan). */
export const KASBON_NAMA_SUPPLIER_DEFAULT = "-";

export function normalizeKasbonNamaSupplier(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : KASBON_NAMA_SUPPLIER_DEFAULT;
}
