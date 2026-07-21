export interface ProgressSertifikatSlot {
  nilaiAjb?: number | null;
  biayaBphtb?: number | null;
  biayaPph?: number | null;
  filePpjb?: string | null;
  fileAjb?: string | null;
}

export interface ProgressSertifikatTambahanSlot extends ProgressSertifikatSlot {
  urutan: number;
  nomorAjb?: string | null;
  tanggalAjb?: Date | string | null;
}

const BPHTB_EXEMPTION = 80_000_000;
const BPHTB_RATE = 0.05;
const PPH_RATE = 0.025;

export interface NilaiAjbSlot {
  urutan: number;
  nilaiAjb: number;
}

export interface PajakSlot {
  biayaPph: number;
  biayaBphtb: number;
}

function getExemptUrutan(slots: NilaiAjbSlot[]): number | null {
  const withValue = slots.filter((slot) => slot.nilaiAjb > 0);
  if (withValue.length <= 1) return null;
  const minNilai = Math.min(...withValue.map((slot) => slot.nilaiAjb));
  const minSlots = withValue.filter((slot) => slot.nilaiAjb === minNilai);
  return Math.min(...minSlots.map((slot) => slot.urutan));
}

export function calcBphtbFromNilaiAjb(
  nilaiAjb: number,
  urutan: number,
  allSlots: NilaiAjbSlot[],
): number {
  if (nilaiAjb <= 0) return 0;
  const exemptUrutan = getExemptUrutan(allSlots);
  if (exemptUrutan === urutan) {
    return nilaiAjb * BPHTB_RATE;
  }
  return Math.max(0, nilaiAjb - BPHTB_EXEMPTION) * BPHTB_RATE;
}

export function calcPajakFromNilaiAjb(
  nilaiAjb: number,
  options?: { urutan?: number; allSlots?: NilaiAjbSlot[] },
): PajakSlot {
  const biayaPph = nilaiAjb * PPH_RATE;
  const biayaBphtb =
    options?.allSlots && options.urutan != null
      ? calcBphtbFromNilaiAjb(nilaiAjb, options.urutan, options.allSlots)
      : Math.max(0, nilaiAjb - BPHTB_EXEMPTION) * BPHTB_RATE;
  return { biayaPph, biayaBphtb };
}

export function calcPajakAllSlots(slots: NilaiAjbSlot[]): Map<number, PajakSlot> {
  const result = new Map<number, PajakSlot>();
  for (const slot of slots) {
    result.set(
      slot.urutan,
      calcPajakFromNilaiAjb(slot.nilaiAjb, {
        urutan: slot.urutan,
        allSlots: slots,
      }),
    );
  }
  return result;
}

export function sumNilaiAjb(
  utama: ProgressSertifikatSlot | null | undefined,
  tambahan: ProgressSertifikatTambahanSlot[] = [],
): number {
  const utamaVal = utama?.nilaiAjb ? Number(utama.nilaiAjb) : 0;
  const tambahanVal = tambahan.reduce(
    (sum, row) => sum + (row.nilaiAjb ? Number(row.nilaiAjb) : 0),
    0,
  );
  return utamaVal + tambahanVal;
}

export function sumBiayaBphtb(
  utama: ProgressSertifikatSlot | null | undefined,
  tambahan: ProgressSertifikatTambahanSlot[] = [],
): number {
  const utamaVal = utama?.biayaBphtb ? Number(utama.biayaBphtb) : 0;
  const tambahanVal = tambahan.reduce(
    (sum, row) => sum + (row.biayaBphtb ? Number(row.biayaBphtb) : 0),
    0,
  );
  return utamaVal + tambahanVal;
}

export function sumBiayaPph(
  utama: ProgressSertifikatSlot | null | undefined,
  tambahan: ProgressSertifikatTambahanSlot[] = [],
): number {
  const utamaVal = utama?.biayaPph ? Number(utama.biayaPph) : 0;
  const tambahanVal = tambahan.reduce(
    (sum, row) => sum + (row.biayaPph ? Number(row.biayaPph) : 0),
    0,
  );
  return utamaVal + tambahanVal;
}

export function isSertifikatSlotComplete(
  slot: ProgressSertifikatSlot | null | undefined,
  fields: Array<keyof ProgressSertifikatSlot>,
): boolean {
  if (!slot) return false;
  return fields.every((field) => {
    const value = slot[field];
    return value != null && String(value).trim() !== "";
  });
}

export function isAllSertifikatTanahFilesComplete(
  jumlahSertifikatTanah: number,
  utama: {
    filePbg?: string | null;
    fileSertifikatTanah?: string | null;
    fileNopPbb?: string | null;
  },
  tambahan: Array<{
    urutan: number;
    filePbg?: string | null;
    fileSertifikatTanah?: string | null;
    fileNopPbb?: string | null;
  }> = [],
): boolean {
  for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
    const row =
      urutan === 1
        ? utama
        : tambahan.find((item) => item.urutan === urutan);
    if (
      !row?.filePbg?.trim() ||
      !row?.fileSertifikatTanah?.trim() ||
      !row?.fileNopPbb?.trim()
    ) {
      return false;
    }
  }
  return true;
}

export function isAllProgressFilePpjbComplete(
  jumlahSertifikatTanah: number,
  utama: ProgressSertifikatSlot | null | undefined,
  tambahan: ProgressSertifikatTambahanSlot[] = [],
): boolean {
  // Multi sertifikat: PPJB tetap 1 (hanya urutan 1), AJB mengikuti jumlah sertifikat
  void jumlahSertifikatTanah;
  void tambahan;
  return Boolean(utama?.filePpjb?.trim());
}

export function isAllProgressFileAjbComplete(
  jumlahSertifikatTanah: number,
  utama: ProgressSertifikatSlot | null | undefined,
  tambahan: ProgressSertifikatTambahanSlot[] = [],
): boolean {
  for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
    const slot =
      urutan === 1
        ? utama
        : tambahan.find((item) => item.urutan === urutan);
    if (!slot?.fileAjb?.trim()) return false;
  }
  return true;
}
