export interface CustomerEntity {
  id: number;
  nikKtp: string;
  nama: string;
  noHp: string;
  email: string | null;
  pekerjaan: string | null;
  perusahaan: string | null;
  alamatKorespondensi: string | null;
  alamatKtp: string;
  alamatTinggal: string | null;
  fileKtp: string | null;
  fileKk: string | null;
  fileNpwp: string | null;
  userId: number | null;
  hasAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}
