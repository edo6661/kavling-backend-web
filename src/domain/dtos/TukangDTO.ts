export interface UpsertTukangDTO {
  nik: string;
  nama: string;
}

export interface TukangFilterDTO {
  search?: string;
}

export interface TukangListContext {
  userId: number;
  role: string;
}
