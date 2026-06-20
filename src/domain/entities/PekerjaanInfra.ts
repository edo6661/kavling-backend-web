import type { PekerjaanInfraKategori } from "@prisma/client";

export interface PekerjaanInfraEntity {
  id: number;
  nama: string;
  kategori: PekerjaanInfraKategori;
  urutan: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
