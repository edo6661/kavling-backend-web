import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";

export const getProgressPenjualanSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus berupa angka"),
  }),
};

export const updateProgressPenjualanSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus berupa angka"),
  }),
  body: z.object({
    berkasCustomerValid: emptyAsUndefined(z.boolean().optional()),
    nilaiAjb: emptyAsUndefined(z.coerce.number().min(0).optional()),
    notarisId: emptyAsUndefined(z.coerce.number().optional().nullable()),
    biayaNotaris: emptyAsUndefined(
      z.coerce.number().min(0).optional().nullable(),
    ),

    nomorAjb: emptyAsUndefined(z.string().optional()),
    tanggalAjb: emptyAsUndefined(z.string().optional()),
    fileAjb: emptyAsUndefined(z.string().optional()),
    sertifikatUrutan: emptyAsUndefined(
      z.coerce.number().int().min(1).max(5).optional(),
    ),

    checklistBast: emptyAsUndefined(
      z
        .record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean(), z.null()]),
        )
        .nullable()
        .optional(),
    ),
  }),
};

export const uploadProgressDocumentSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus berupa angka"),
    docType: z.enum([
      "fileSp3k",
      "fileSuratPernyataanAkadKredit",
      "fileSalinanAjb",
      "filePpjb",
      "fileAjb",
      "fileBast",
    ]),
  }),
  query: z.object({
    sertifikatUrutan: z.coerce.number().int().min(1).max(5).optional(),
  }),
};

export const addTahapanLogSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus angka"),
  }),
  body: z.object({
    namaTahapan: z.string().min(1),
    persentase: z.coerce.number().min(0).max(100),
    deskripsi: z.string().optional().nullable(),
    tanggal: z.string().datetime().or(z.string().min(1)),
  }),
};
