export interface TukangEntity {
  id: number;
  nik: string;
  nama: string;
  mandorId: number | null;
  mandorUsername?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
