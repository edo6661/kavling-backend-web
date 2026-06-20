import type { PekerjaanInfraKategori } from "@prisma/client";

export interface CreatePekerjaanInfraDTO {
  nama: string;
  kategori?: PekerjaanInfraKategori;
  urutan?: number;
}

export interface UpdatePekerjaanInfraDTO {
  nama?: string;
  kategori?: PekerjaanInfraKategori;
  urutan?: number;
  isActive?: boolean;
}
