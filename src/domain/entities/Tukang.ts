export interface TukangEntity {
  id: number;
  nik: string;
  nama: string;
  ktp: string | null;
  sudahMenikah: boolean | null;
  jumlahAnak: number | null;
  mandorId: number | null;
  mandorUsername?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
