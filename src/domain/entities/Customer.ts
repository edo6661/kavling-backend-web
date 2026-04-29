export interface CustomerEntity {
  id: number;
  nikKtp: string;
  nama: string;
  noHp: string;
  email: string | null;
  pekerjaan: string | null;
  perusahaan: string | null;
  bank: string | null;
  alamatKoresponden: string | null;
  alamatKtp: string;
  alamatTinggal: string | null;
  fileKtp: string | null;
  fileKk: string | null;
  fileNpwp: string | null;
  dokumenLainnya: any;
  userId: number | null;
  hasAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}
