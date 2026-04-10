// src/validations/customerKavlingSchema.ts
import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import { UnitStatus, SP3R } from "@prisma/client";

export const getCustomerKavlingsPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};

export const updateCustomerKavlingSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus berupa angka"),
  }),
  body: z.object({
    // Kavling Utama
    statusKavling: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
    namaTipe: emptyAsUndefined(z.string().optional()),
    luasBangunan: emptyAsUndefined(z.coerce.number().min(0).optional()),
    luasTanah: emptyAsUndefined(z.coerce.number().min(0).optional()),
    hargaJualKavling: emptyAsUndefined(z.coerce.number().min(0).optional()),

    // Detail Kavling Pajak - Data Utama
    notarisId: emptyAsUndefined(z.coerce.number().optional()),
    lantai: emptyAsUndefined(z.string().optional()),
    lokasiStrategis: emptyAsUndefined(z.string().optional()),
    tanggalAkadPpjb: emptyAsUndefined(z.string().optional()),
    akadPpjb: emptyAsUndefined(z.string().optional()),
    tanggalAkadAjbPpat: emptyAsUndefined(z.string().optional()),
    tanggalPembayaranPph: emptyAsUndefined(z.string().optional()),
    tanggalPembayaranBphtb: emptyAsUndefined(z.string().optional()),
    pembiayaan: emptyAsUndefined(z.string().optional()),
    sp3r: emptyAsUndefined(z.nativeEnum(SP3R).optional()),
    lebihTanah: emptyAsUndefined(z.coerce.number().optional()),
    biayaStrategis: emptyAsUndefined(z.coerce.number().optional()),

    // Nilai Rumah
    nrBiayaKprAsuransi: emptyAsUndefined(z.coerce.number().optional()),
    nrDiskonAngsuran: emptyAsUndefined(z.coerce.number().optional()),
    nrDiskonCash: emptyAsUndefined(z.coerce.number().optional()),
    nrBiayaBbn: emptyAsUndefined(z.coerce.number().optional()),
    nrBiayaNotarisAjb: emptyAsUndefined(z.coerce.number().optional()),
    nrBiayaAppraisal: emptyAsUndefined(z.coerce.number().optional()),
    nrBiayaBphtb: emptyAsUndefined(z.coerce.number().optional()),
    nrLainLain: emptyAsUndefined(z.coerce.number().optional()),
    nrTotalSubsidi: emptyAsUndefined(z.coerce.number().optional()),
    nrNilaiPenyerahan: emptyAsUndefined(z.coerce.number().optional()),
    nrPpn: emptyAsUndefined(z.coerce.number().optional()),
    nrBphtb: emptyAsUndefined(z.coerce.number().optional()),
    nrPph: emptyAsUndefined(z.coerce.number().optional()),

    // Pajak
    pjBiayaKpr: emptyAsUndefined(z.coerce.number().optional()),
    pjBiayaAsuransi: emptyAsUndefined(z.coerce.number().optional()),
    pjDiskonAngsuran: emptyAsUndefined(z.coerce.number().optional()),
    pjBiayaBbn: emptyAsUndefined(z.coerce.number().optional()),
    pjBiayaAjb: emptyAsUndefined(z.coerce.number().optional()),
    pjBiayaAppraisal: emptyAsUndefined(z.coerce.number().optional()),
    pjBphtb: emptyAsUndefined(z.coerce.number().optional()),
    pjLainLain: emptyAsUndefined(z.coerce.number().optional()),
    pjTotalSubsidi: emptyAsUndefined(z.coerce.number().optional()),
    pjNilaiPenyerahan: emptyAsUndefined(z.coerce.number().optional()),
    pjPpn: emptyAsUndefined(z.coerce.number().optional()),
    pjBphtbPajak: emptyAsUndefined(z.coerce.number().optional()),
    pjPph: emptyAsUndefined(z.coerce.number().optional()),
    pjTotalBphtbPph: emptyAsUndefined(z.coerce.number().optional()),

    // AJB
    ajbNjopTanahPerMeter: emptyAsUndefined(z.coerce.number().optional()),
    ajbNjopTanah: emptyAsUndefined(z.coerce.number().optional()),
    ajbNjopBangunanPerMeter: emptyAsUndefined(z.coerce.number().optional()),
    ajbNjopBangunan: emptyAsUndefined(z.coerce.number().optional()),
    ajbNjopTotal: emptyAsUndefined(z.coerce.number().optional()),
    ajbPpn: emptyAsUndefined(z.coerce.number().optional()),
    ajbBphtb: emptyAsUndefined(z.coerce.number().optional()),
    ajbPph: emptyAsUndefined(z.coerce.number().optional()),
    ajbTotalBphtbPph: emptyAsUndefined(z.coerce.number().optional()),
    ajbSelisihPajakPbb: emptyAsUndefined(z.coerce.number().optional()),
    ajbUping: emptyAsUndefined(z.coerce.number().optional()),
  }),
};
