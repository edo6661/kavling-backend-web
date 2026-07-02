export interface SpkKavlingTransferSource {
  spkId: number;
  noSpk: string;
  transferringKavlingIds: number[];
}

/**
 * Cek apakah pemindahan kavling akan mengosongkan SPK sumber sepenuhnya.
 * Return grup pertama yang diblokir, atau null jika semua transfer aman.
 */
export function findBlockedKavlingTransferSource(
  sources: SpkKavlingTransferSource[],
  totalKavlingsBySpkId: ReadonlyMap<number, number>,
): SpkKavlingTransferSource | null {
  for (const source of sources) {
    const total = totalKavlingsBySpkId.get(source.spkId) ?? 0;
    if (total <= source.transferringKavlingIds.length) {
      return source;
    }
  }
  return null;
}
