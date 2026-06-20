import { PekerjaanInfraKategori } from "@prisma/client";

export const PEKERJAAN_INFRA_KATEGORI_LABEL: Record<PekerjaanInfraKategori, string> = {
  SALURAN: "Pek Saluran",
  JALAN: "Pek Jalan",
  LAINNYA: "Lainnya",
};

export const PEKERJAAN_INFRA_KATEGORI_ORDER: PekerjaanInfraKategori[] = [
  PekerjaanInfraKategori.SALURAN,
  PekerjaanInfraKategori.JALAN,
  PekerjaanInfraKategori.LAINNYA,
];

export const STANDARD_PEKERJAAN_INFRA_ITEMS: {
  nama: string;
  kategori: PekerjaanInfraKategori;
  urutan: number;
}[] = [
  { nama: "Galian", kategori: PekerjaanInfraKategori.SALURAN, urutan: 1 },
  { nama: "Pemasangan buis / gorong gorong", kategori: PekerjaanInfraKategori.SALURAN, urutan: 2 },
  { nama: "Urugan", kategori: PekerjaanInfraKategori.SALURAN, urutan: 3 },
  { nama: "Perapihan", kategori: PekerjaanInfraKategori.SALURAN, urutan: 4 },
  { nama: "Kupas tanah", kategori: PekerjaanInfraKategori.JALAN, urutan: 5 },
  { nama: "Tebar limestone", kategori: PekerjaanInfraKategori.JALAN, urutan: 6 },
  { nama: "Tebar makadam", kategori: PekerjaanInfraKategori.JALAN, urutan: 7 },
  { nama: "Perataan makadam", kategori: PekerjaanInfraKategori.JALAN, urutan: 8 },
  { nama: "Pembuatan bak kontrol", kategori: PekerjaanInfraKategori.JALAN, urutan: 9 },
  { nama: "Pemasangan bekisting", kategori: PekerjaanInfraKategori.JALAN, urutan: 10 },
  { nama: "Pasang plastik cor", kategori: PekerjaanInfraKategori.JALAN, urutan: 11 },
  { nama: "Pemasangan wiremesh", kategori: PekerjaanInfraKategori.JALAN, urutan: 12 },
  { nama: "Pemasangan beton tahu", kategori: PekerjaanInfraKategori.JALAN, urutan: 13 },
  { nama: "Perapihan cor (gosok poles)", kategori: PekerjaanInfraKategori.JALAN, urutan: 14 },
  { nama: "Sisir beton", kategori: PekerjaanInfraKategori.JALAN, urutan: 15 },
  { nama: "Cutting beton", kategori: PekerjaanInfraKategori.JALAN, urutan: 16 },
  { nama: "Selimut beton / penyiraman", kategori: PekerjaanInfraKategori.JALAN, urutan: 17 },
];
