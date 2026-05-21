import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";

export const createPerusahaanAgentSchema = {
  body: z.object({
    nama: z.string().min(3, "Nama perusahaan minimal 3 karakter"),
    npwp: emptyAsUndefined(z.string().optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    feeMarketingPct: emptyAsUndefined(
      z.coerce.number().min(0).max(100, "Persentase maksimal 100").optional(),
    ),
    feeClosingNominal: emptyAsUndefined(z.coerce.number().min(0).optional()),
    potonganPph: emptyAsUndefined(
      z.coerce.number().min(0).max(100, "Persentase maksimal 100").optional(),
    ),
  }),
};

export const updatePerusahaanAgentSchema = {
  params: z.object({ id: z.string().regex(/^\d+$/, "ID harus berupa angka") }),
  body: z.object({
    nama: emptyAsUndefined(z.string().min(3).optional()),
    npwp: emptyAsUndefined(z.string().optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    feeMarketingPct: emptyAsUndefined(
      z.coerce.number().min(0).max(100).optional(),
    ),
    feeClosingNominal: emptyAsUndefined(z.coerce.number().min(0).optional()),
    potonganPph: emptyAsUndefined(z.coerce.number().min(0).max(100).optional()),
  }),
};

export const getPerusahaanAgentPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};
