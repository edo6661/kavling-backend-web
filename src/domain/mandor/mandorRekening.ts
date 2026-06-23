export interface MandorRekeningSnapshot {
  id: number;
  label: string | null;
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  isDefault: boolean;
}

export interface MandorRekeningInput {
  id?: number;
  label?: string | null;
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  isDefault?: boolean;
}

export function pickDefaultMandorRekening<
  T extends { isDefault: boolean },
>(list: T[]): T | undefined {
  return list.find((item) => item.isDefault) ?? list[0];
}
