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

export const getProgressProyekByKavlingSchema = {
  params: z.object({
    kavlingId: z.string().regex(/^\d+$/, "ID Kavling harus berupa angka"),
  }),
};

export const uploadTahapanPhotoByKavlingSchema = {
  params: z.object({
    kavlingId: z.string().regex(/^\d+$/, "ID Kavling harus berupa angka"),
    namaTahapan: z.string().min(1, "Nama tahapan wajib diisi"),
  }),
};

export const addTahapanLogByKavlingSchema = {
  params: z.object({
    kavlingId: z.string().regex(/^\d+$/, "ID Kavling harus berupa angka"),
  }),
  body: z.object({
    namaTahapan: z.string().min(1),
    persentase: z.coerce.number().min(0).max(100),
    deskripsi: z.string().optional().nullable(),
    tanggal: z.string().datetime().or(z.string().min(1)),
  }),
};

export const setTotalProgressByKavlingSchema = {
  params: z.object({
    kavlingId: z.string().regex(/^\d+$/, "ID Kavling harus berupa angka"),
  }),
  body: z.object({
    persentase: z.coerce.number().min(0).max(100),
  }),
};

export const resetTotalProgressByKavlingSchema = {
  params: z.object({
    kavlingId: z.string().regex(/^\d+$/, "ID Kavling harus berupa angka"),
  }),
};
