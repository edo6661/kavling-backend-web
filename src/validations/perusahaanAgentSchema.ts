import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";

export const createPerusahaanAgentSchema = {
  body: z.object({
    nama: z.string().min(3, "Nama perusahaan minimal 3 karakter"),
  }),
};

export const updatePerusahaanAgentSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    nama: emptyAsUndefined(z.string().min(3).optional()),
  }),
};

export const getPerusahaanAgentPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};
