export interface PicNotarisEntity {
  id: number;
  notarisId: number;
  nama: string;
  noHp: string;
  alamat: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AjbDitanganiEntity {
  id: string;
  customer: string;
  kavling: string;
}

export interface NotarisEntity {
  id: number;
  nama: string;
  biayaAjb: number;
  nomorKtp: string | null;
  nomorIjin: string | null;
  noHp: string | null;
  alamat: string | null;

  pics: PicNotarisEntity[];
  ajbDitangani?: AjbDitanganiEntity[];
  createdAt: Date;
  updatedAt: Date;
}
