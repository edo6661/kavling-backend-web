import type {
  SpkKasbonTargetTermin,
  SpkPembayaranJenis,
  SpkPembayaranStatus,
} from "@prisma/client";

export interface SpkPembayaranEntity {
  id: number;
  spkId: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  keterangan: string | null;
  mengurangiTermin: SpkKasbonTargetTermin | null;
  status: SpkPembayaranStatus;
  buktiPembayaran: string | null;
  tanggalPembayaran: Date | null;
  diajukanOlehId: number;
  dibayarOlehId: number | null;
  diajukanOleh: { id: number; username: string };
  dibayarOleh: { id: number; username: string } | null;
  createdAt: Date;
  updatedAt: Date;
  spk?: {
    id: number;
    noSpk: string;
    judulPekerjaan: string;
    nilaiKontrak: number;
    mandor: {
      id: number;
      username: string;
      namaBank: string;
      noRekening: string;
      atasNamaRekening: string;
    };
  };
}
