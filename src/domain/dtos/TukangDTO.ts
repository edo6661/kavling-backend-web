export interface UpsertTukangDTO {
  nik: string;
  nama: string;
  ktp?: string | null | undefined;
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
