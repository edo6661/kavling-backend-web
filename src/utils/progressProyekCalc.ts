type TahapanLike = {
  namaTahapan: string;
  persentase: number | { toString(): string };
  tanggal: Date;
  id?: number;
};

export const TOTAL_TAHAPAN_PROYEK = 9;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const getLatestTahapanPersentaseByName = (
  tahapan: TahapanLike[],
): Map<string, number> => {
  const sorted = [...tahapan].sort((a, b) => {
    const dateDiff = b.tanggal.getTime() - a.tanggal.getTime();
    if (dateDiff !== 0) return dateDiff;
    return (b.id || 0) - (a.id || 0);
  });

  const unique = new Map<string, number>();
  for (const item of sorted) {
    if (!unique.has(item.namaTahapan)) {
      unique.set(item.namaTahapan, Number(item.persentase));
    }
  }
  return unique;
};

export const calculateTotalProgressFromTahapan = (
  tahapan: TahapanLike[],
): number => {
  const unique = getLatestTahapanPersentaseByName(tahapan);
  const totalSum = Array.from(unique.values()).reduce((acc, val) => acc + val, 0);
  const rataRata = totalSum / TOTAL_TAHAPAN_PROYEK;
  return clampPercent(Number(rataRata.toFixed(2)));
};

export const getEffectiveTotalProgress = (input: {
  persentase: number;
  persentaseIsOverride: boolean;
  tahapan: TahapanLike[];
}): number => {
  const stored = clampPercent(input.persentase);

  if (!input.persentaseIsOverride && stored === 0 && input.tahapan.length > 0) {
    return calculateTotalProgressFromTahapan(input.tahapan);
  }

  return stored;
};
