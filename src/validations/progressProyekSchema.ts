import { z } from "zod";
import { offsetPaginationQuerySchema } from "./paginationSchema.js";
import { emptyAsUndefined } from "./emptySchema.js";

export const getProgressProyekListSchema = {
  query: offsetPaginationQuerySchema,
};

const tahapanSchema = z.object({
  namaTahapan: z.string().min(1, "Nama tahapan wajib diisi"),
  persentase: z.coerce.number().min(0).max(100),
  deskripsi: emptyAsUndefined(z.string().optional()),
  tanggal: z.coerce.date(),
  foto: z.array(z.string()).default([]),
});

export const updateProgressProyekSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus berupa angka"),
  }),
  body: z.object({
    tahapan: z.array(tahapanSchema).optional(),
  }),
};

export const getProgressProyekSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus berupa angka"),
  }),
};

export const uploadTahapanPhotoSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Penjualan harus berupa angka"),
    namaTahapan: z.string().min(1, "Nama tahapan wajib diisi"),
  }),
};
