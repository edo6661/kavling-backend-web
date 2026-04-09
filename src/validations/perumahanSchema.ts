import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";

export const createPerumahanSchema = {
  body: z.object({
    nama: z.string().min(3, "Nama perumahan minimal 3 karakter"),
    logo: z.string().min(1, "Logo wajib diisi"),
    alamat: z.string().min(5, "Alamat wajib diisi"),
  }),
};

export const updatePerumahanSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    nama: emptyAsUndefined(z.string().min(3).optional()),
    logo: emptyAsUndefined(z.string().min(1).optional()),
    alamat: emptyAsUndefined(z.string().min(5).optional()),
  }),
};

export const getPerumahanPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};
