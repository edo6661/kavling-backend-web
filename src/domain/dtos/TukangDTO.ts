export interface UpsertTukangDTO {
  nik: string;
  nama: string;
  /** NIK lama saat edit — dipakai untuk lookup baris yang diubah (termasuk koreksi NIK). */
  originalNik?: string | null | undefined;
  sudahMenikah?: boolean | null | undefined;
  jumlahAnak?: number | null | undefined;
}

export interface TukangFilterDTO {
  search?: string;
}

export interface TukangListContext {
  userId: number;
  role: string;
}
