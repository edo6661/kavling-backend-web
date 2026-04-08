import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import { Sp3r, StatusAkadPpjb } from "@prisma/client";

export const createMasterDataProgressSchema = {
  body: z.object({
    sprId: z.coerce.number().int().positive("ID SPR tidak valid"),
  }),
};

const optionalNumber = emptyAsUndefined(z.coerce.number().optional());
const optionalDate = emptyAsUndefined(z.coerce.date().optional());
const optionalString = emptyAsUndefined(z.string().optional());

export const updateMasterDataProgressSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    tanggalAkadPpjb: optionalDate,
    statusAkadPpjb: emptyAsUndefined(z.nativeEnum(StatusAkadPpjb).optional()),
    tanggalAkadAjbPpat: optionalDate,
    tanggalPembayaranPph: optionalDate,
    tanggalPembayaranBphtb: optionalDate,
    pembiayaan: optionalString,
    sp3r: emptyAsUndefined(z.nativeEnum(Sp3r).optional()),
    hargaLebihTanah: optionalNumber,
    biayaStrategis: optionalNumber,
    biayaKpr: optionalNumber,
    biayaAsuransi: optionalNumber,
    diskonAngsuran: optionalNumber,
    diskonCashKeras: optionalNumber,
    diskonLainnya: optionalNumber,
    biayaBalikNama: optionalNumber,
    biayaNotarisAjb: optionalNumber,
    biayaAppraisal: optionalNumber,
    biayaBphtb: optionalNumber,
    biayaLainLain: optionalNumber,
    ppn: optionalNumber,
    pph: optionalNumber,
    njopTanahPerMeter: optionalNumber,
    njopBangunanPerMeter: optionalNumber,
    uping: optionalNumber,
  }),
};

export const getMasterDataProgressPaginatedSchema = {
  query: cursorPaginationQuerySchema.extend({
    sprId: optionalNumber,
    statusAkadPpjb: emptyAsUndefined(z.nativeEnum(StatusAkadPpjb).optional()),
  }),
};
