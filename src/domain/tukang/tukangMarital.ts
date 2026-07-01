export const TUKANG_MAX_JUMLAH_ANAK = 3;

export interface TukangMaritalInput {
  sudahMenikah?: boolean | null | undefined;
  jumlahAnak?: number | null | undefined;
}

export function normalizeTukangMaritalForSave(
  input: TukangMaritalInput,
): { sudahMenikah: boolean; jumlahAnak: number } | null {
  if (input.sudahMenikah === undefined || input.sudahMenikah === null) {
    return null;
  }
  if (!input.sudahMenikah) {
    return { sudahMenikah: false, jumlahAnak: 0 };
  }
  const jumlahAnak = input.jumlahAnak ?? null;
  if (jumlahAnak === null || !Number.isInteger(jumlahAnak)) {
    throw new Error("TUKANG_JUMLAH_ANAK_REQUIRED");
  }
  if (jumlahAnak < 0 || jumlahAnak > TUKANG_MAX_JUMLAH_ANAK) {
    throw new Error("TUKANG_JUMLAH_ANAK_INVALID");
  }
  return { sudahMenikah: true, jumlahAnak };
}

export function formatTukangPtkpStatus(
  sudahMenikah: boolean | null | undefined,
  jumlahAnak: number | null | undefined,
): string | null {
  if (sudahMenikah === null || sudahMenikah === undefined) return null;
  if (!sudahMenikah) return "TK/0";
  const anak = Math.min(
    Math.max(0, jumlahAnak ?? 0),
    TUKANG_MAX_JUMLAH_ANAK,
  );
  return `K/${anak}`;
}
