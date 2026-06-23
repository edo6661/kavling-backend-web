import type {
  SpkKasbonTargetTermin,
  SpkPembayaranJenis,
  SpkPembayaranStatus,
} from "@prisma/client";

export interface SpkPembayaranUpahBarisEntity {
  id: number;
  spkPembayaranId: number;
  tukangId: number | null;
  nik: string;
  nama: string;
  nominal: number;
}

export interface SpkPembayaranKasbonBarisEntity {
  id: number;
  spkPembayaranId: number;
  namaSupplier: string;
  keterangan: string;
  tanggalPo: Date;
  nominal: number;
  fotoBon: string | null;
}

export interface SpkPembayaranEntity {
  id: number;
  spkId: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  keterangan: string | null;
  tanggalPo: Date | null;
  tanggalDari: Date | null;
  tanggalSampai: Date | null;
  mengurangiTermin: SpkKasbonTargetTermin | null;
  upahBaris?: SpkPembayaranUpahBarisEntity[];
  kasbonBaris?: SpkPembayaranKasbonBarisEntity[];
  status: SpkPembayaranStatus;
  buktiPembayaran: string | null;
  buktiPembayaranList: string[];
  tanggalPembayaran: Date | null;
  bsiCmsDilaporkan: boolean;
  bsiCmsDilaporkanAt: Date | null;
  diajukanOlehId: number;
  disetujuiOlehId: number | null;
  tanggalDisetujui: Date | null;
  dibayarOlehId: number | null;
  diajukanOleh: { id: number; username: string };
  disetujuiOleh: { id: number; username: string } | null;
  dibayarOleh: { id: number; username: string } | null;
  createdAt: Date;
  updatedAt: Date;
  mandorRekeningId?: number | null;
  mandorRekening?: {
    id: number;
    label: string | null;
    namaBank: string;
    noRekening: string;
    atasNamaRekening: string;
    isDefault: boolean;
  } | null;
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
