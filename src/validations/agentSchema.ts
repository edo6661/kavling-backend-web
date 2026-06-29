import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { offsetPaginationQuerySchema } from "./paginationSchema.js";
import { AgentStatus, AgentType } from "@prisma/client";
import { requiredNikDigitsSchema } from "./nikSchema.js";

// Schema untuk nested PIC
const picSchema = z.object({
  nama: z.string().min(3, "Nama PIC minimal 3 karakter"),
  noHp: z.string().min(9, "Nomor HP PIC minimal 9 karakter"),
  alamat: emptyAsUndefined(z.string().optional()),
});
export const createAgentSchema = {
  body: z.object({
    nik: requiredNikDigitsSchema,
    nama: z.string().min(3, "Nama Agent minimal 3 karakter"),
    noHp: z.string().min(9, "Nomor HP minimal 9 karakter"),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    alamat: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(AgentStatus).optional()),
    type: emptyAsUndefined(z.nativeEnum(AgentType).optional()),
    perusahaanAgentId: emptyAsUndefined(z.coerce.number().optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    feeMarketingPct: emptyAsUndefined(
      z.coerce.number().min(0).max(100, "Persentase maksimal 100").optional(),
    ),
    feeClosingNominal: emptyAsUndefined(z.coerce.number().min(0).optional()), // <-- Ganti menjadi ini (tanpa max 100) // <-- TAMBAHKAN INI
    potonganPph: emptyAsUndefined(
      z.coerce.number().min(0).max(100, "Persentase maksimal 100").optional(),
    ),
    isInHouse: emptyAsUndefined(z.coerce.boolean().optional()),
    pics: emptyAsUndefined(z.array(picSchema).optional()),
  }),
};
export const updateAgentSchema = {
  params: z.object({ id: z.string().regex(/^\d+$/, "ID harus berupa angka") }),
  body: z.object({
    nik: emptyAsUndefined(requiredNikDigitsSchema.optional()),
    nama: emptyAsUndefined(z.string().min(3).optional()),
    noHp: emptyAsUndefined(z.string().min(9).optional()),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    alamat: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(AgentStatus).optional()),
    type: emptyAsUndefined(z.nativeEnum(AgentType).optional()),
    perusahaanAgentId: z.union([z.coerce.number(), z.null()]).optional(),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    feeMarketingPct: emptyAsUndefined(
      z.coerce.number().min(0).max(100).optional(),
    ),
    feeClosingNominal: emptyAsUndefined(z.coerce.number().min(0).optional()), // <-- Ganti menjadi ini (tanpa max 100) // <-- TAMBAHKAN INI
    potonganPph: emptyAsUndefined(z.coerce.number().min(0).max(100).optional()),
    isInHouse: emptyAsUndefined(z.coerce.boolean().optional()),
    pics: emptyAsUndefined(z.array(picSchema).optional()),
  }),
};
export const updateAgentSelfSchema = {
  body: z.object({
    nik: emptyAsUndefined(requiredNikDigitsSchema.optional()),
    nama: emptyAsUndefined(
      z.string().min(3, "Nama Agent minimal 3 karakter").optional(),
    ),
    noHp: emptyAsUndefined(
      z.string().min(9, "Nomor HP minimal 9 karakter").optional(),
    ),
    alamat: emptyAsUndefined(z.string().optional()),
    namaBank: emptyAsUndefined(z.string().min(1, "Nama bank wajib diisi").optional()),
    noRekening: emptyAsUndefined(
      z.string().min(1, "Nomor rekening wajib diisi").optional(),
    ),
    atasNamaRekening: emptyAsUndefined(
      z.string().min(1, "Atas nama rekening wajib diisi").optional(),
    ),
  }),
};

export const generateAgentAccountSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Agent harus berupa angka"),
  }),
  body: z.object({
    password: z.string().min(6, "Password minimal 6 karakter"),
  }),
};
export const getAgentsPaginatedSchema = {
  query: offsetPaginationQuerySchema.extend({
    status: emptyAsUndefined(z.nativeEnum(AgentStatus).optional()),
    type: emptyAsUndefined(z.nativeEnum(AgentType).optional()),
  }),
};
