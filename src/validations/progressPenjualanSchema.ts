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

    nomorAjb: emptyAsUndefined(z.string().optional()),
    tanggalAjb: emptyAsUndefined(z.string().optional()),
    fileAjb: emptyAsUndefined(z.string().optional()),

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
      "fileSalinanAjb",
      "filePpjb",
      "fileAjb",
      "fileBast",
    ]),
  }),
};
