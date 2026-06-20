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

export function calcPajakFromNilaiAjb(nilaiAjb: number): {
  biayaPph: number;
  biayaBphtb: number;
} {
  const biayaPph = nilaiAjb * 0.025;
  const biayaBphtb = Math.max(0, nilaiAjb - 80_000_000) * 0.05;
  return { biayaPph, biayaBphtb };
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
  for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
    const slot =
      urutan === 1
        ? utama
        : tambahan.find((item) => item.urutan === urutan);
    if (!slot?.filePpjb?.trim()) return false;
  }
  return true;
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
