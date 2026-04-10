export interface PicNotarisEntity {
  id: number;
  notarisId: number;
  nama: string;
  noHp: string;
  alamat: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotarisEntity {
  id: number;
  nama: string;
  biayaAjb: number;
  pics: PicNotarisEntity[];
  createdAt: Date;
  updatedAt: Date;
}
