import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import {
  SprStatus,
  CaraPembayaran,
  StatusAkadPpjb,
  Sp3r,
} from "@prisma/client";
export const createSprSchema = {
  body: z.object({
    customerId: z.coerce.number().int().positive("ID Customer tidak valid"),
    unitId: z.coerce.number().int().positive("ID Unit tidak valid"),

    marketingUserId: emptyAsUndefined(
      z.coerce.number().int().positive("ID Marketing tidak valid").optional(),
    ),
    bookingFee: emptyAsUndefined(z.coerce.number().positive().optional()),
    closingFee: emptyAsUndefined(z.coerce.number().positive().optional()),
    marketingFee: emptyAsUndefined(z.coerce.number().positive().optional()),

    bankRekeningPtId: z.coerce
      .number()
      .int()
      .positive("ID Rekening PT tidak valid"),
    hargaJual: z.coerce.number().positive("Harga jual harus lebih dari 0"),
    diskonPenjualan: emptyAsUndefined(
      z.coerce.number().nonnegative().optional(),
    ),
    paketPromosi: emptyAsUndefined(z.string().optional()),
    caraPembayaran: z.nativeEnum(CaraPembayaran, {
      message: "Cara pembayaran tidak valid",
    }),
    nilaiPengajuanKpr: emptyAsUndefined(
      z.coerce.number().nonnegative().optional(),
    ),
    bankKpr: emptyAsUndefined(z.string().optional()),
    agent: emptyAsUndefined(z.string().optional()),
  }),
};

export const updateSprSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    hargaJual: emptyAsUndefined(z.coerce.number().positive().optional()),
    diskonPenjualan: emptyAsUndefined(
      z.coerce.number().nonnegative().optional(),
    ),
    paketPromosi: emptyAsUndefined(z.string().optional()),
    caraPembayaran: emptyAsUndefined(z.nativeEnum(CaraPembayaran).optional()),
    nilaiPengajuanKpr: emptyAsUndefined(
      z.coerce.number().nonnegative().optional(),
    ),
    bankKpr: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(SprStatus).optional()),
    agent: emptyAsUndefined(z.string().optional()),
  }),
};

export const getSprPaginatedSchema = {
  query: cursorPaginationQuerySchema.extend({
    status: emptyAsUndefined(z.nativeEnum(SprStatus).optional()),
    caraPembayaran: emptyAsUndefined(z.nativeEnum(CaraPembayaran).optional()),
    customerId: emptyAsUndefined(z.coerce.number().optional()),
    unitId: emptyAsUndefined(z.coerce.number().optional()),
  }),
};

export const cancelSprSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    alasanBatal: z
      .string()
      .min(5, "Alasan pembatalan wajib diisi (minimal 5 karakter)"),
  }),
};
export const fastEntrySprSchema = {
  body: z.object({
    nikKtp: z.string().length(16, "NIK harus tepat 16 karakter"),
    nama: z.string().min(3, "Nama minimal 3 karakter"),
    noHp: z.string().min(9, "Nomor HP minimal 9 karakter"),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    pekerjaan: emptyAsUndefined(z.string().optional()),
    perusahaan: emptyAsUndefined(z.string().optional()),
    alamatKorespondensi: emptyAsUndefined(z.string().optional()),
    alamatKtp: z.string().min(5, "Alamat KTP wajib diisi"),
    alamatTinggal: emptyAsUndefined(z.string().optional()),

    unitId: z.coerce.number().int().positive("ID Unit tidak valid"),
    bankRekeningPtId: z.coerce
      .number()
      .int()
      .positive("ID Rekening PT tidak valid"),
    marketingUserId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),

    hargaJual: z.coerce.number().positive("Harga jual harus lebih dari 0"),
    caraPembayaran: z.nativeEnum(CaraPembayaran),
    bankKpr: emptyAsUndefined(z.string().optional()),
    agent: emptyAsUndefined(z.string().optional()),
    statusAkadPpjb: emptyAsUndefined(z.nativeEnum(StatusAkadPpjb).optional()),

    tanggalAkadPpjb: emptyAsUndefined(z.coerce.date().optional()),
    tanggalAkadAjbPpat: emptyAsUndefined(z.coerce.date().optional()),
    tanggalPembayaranPph: emptyAsUndefined(z.coerce.date().optional()),
    tanggalPembayaranBphtb: emptyAsUndefined(z.coerce.date().optional()),
    pembiayaan: emptyAsUndefined(z.string().optional()),
    sp3r: emptyAsUndefined(z.nativeEnum(Sp3r).optional()),

    hargaLebihTanah: emptyAsUndefined(z.coerce.number().optional()),
    biayaStrategis: emptyAsUndefined(z.coerce.number().optional()),
    biayaKpr: emptyAsUndefined(z.coerce.number().optional()),
    biayaAsuransi: emptyAsUndefined(z.coerce.number().optional()),
    diskonAngsuran: emptyAsUndefined(z.coerce.number().optional()),
    diskonCashKeras: emptyAsUndefined(z.coerce.number().optional()),
    diskonLainnya: emptyAsUndefined(z.coerce.number().optional()),
    biayaBalikNama: emptyAsUndefined(z.coerce.number().optional()),
    biayaNotarisAjb: emptyAsUndefined(z.coerce.number().optional()),
    biayaAppraisal: emptyAsUndefined(z.coerce.number().optional()),
    biayaBphtb: emptyAsUndefined(z.coerce.number().optional()),
    biayaLainLain: emptyAsUndefined(z.coerce.number().optional()),
    ppn: emptyAsUndefined(z.coerce.number().optional()),
    pph: emptyAsUndefined(z.coerce.number().optional()),
    njopTanahPerMeter: emptyAsUndefined(z.coerce.number().optional()),
    njopBangunanPerMeter: emptyAsUndefined(z.coerce.number().optional()),
    uping: emptyAsUndefined(z.coerce.number().optional()),

    bookingFee: emptyAsUndefined(z.coerce.number().optional()),
    tanggalTransferBookingFee: emptyAsUndefined(z.coerce.date().optional()),
    closingFee: emptyAsUndefined(z.coerce.number().optional()),
    tanggalTransferClosingFee: emptyAsUndefined(z.coerce.date().optional()),
    marketingFee: emptyAsUndefined(z.coerce.number().optional()),
    tanggalTransferMarketingFee: emptyAsUndefined(z.coerce.date().optional()),
  }),
};
