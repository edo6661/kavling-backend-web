export interface TukangEntity {
  id: number;
  nik: string;
  nama: string;
  fileKtp: string | null;
  sudahMenikah: boolean | null;
  jumlahAnak: number | null;
  mandorId: number | null;
  mandorUsername?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
