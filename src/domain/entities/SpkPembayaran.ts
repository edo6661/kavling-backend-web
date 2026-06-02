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
  tanggalPo: Date | null;
  mengurangiTermin: SpkKasbonTargetTermin | null;
  status: SpkPembayaranStatus;
  buktiPembayaran: string | null;
  buktiPembayaranList: string[];
  tanggalPembayaran: Date | null;
  bsiCmsDilaporkan: boolean;
  bsiCmsDilaporkanAt: Date | null;
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
    bankRekeningPt: {
      id: number;
      namaBank: string;
      noRekening: string;
      atasNama: string;
    } | null;
    mandor: {
      id: number;
      username: string;
      namaBank: string;
      noRekening: string;
      atasNamaRekening: string;
    };
  };
}
