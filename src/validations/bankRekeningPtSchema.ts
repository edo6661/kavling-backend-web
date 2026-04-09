import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";

export const createBankRekeningPtSchema = {
  body: z.object({
    perumahanId: z
      .number({ error: "Perumahan ID wajib diisi" })
      .int()
      .positive(),
    namaBank: z.string().min(2, "Nama bank minimal 2 karakter"),
    noRekening: z.string().min(5, "Nomor rekening wajib diisi"),
    atasNama: z.string().min(3, "Atas nama wajib diisi"),
  }),
};

export const updateBankRekeningPtSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    perumahanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    namaBank: emptyAsUndefined(z.string().min(2).optional()),
    noRekening: emptyAsUndefined(z.string().min(5).optional()),
    atasNama: emptyAsUndefined(z.string().min(3).optional()),
  }),
};

export const getBankRekeningPtPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};
