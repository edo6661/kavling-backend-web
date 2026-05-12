import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import { AgentStatus, AgentType } from "@prisma/client";

// Schema untuk nested PIC
const picSchema = z.object({
  nama: z.string().min(3, "Nama PIC minimal 3 karakter"),
  noHp: z.string().min(9, "Nomor HP PIC minimal 9 karakter"),
  alamat: emptyAsUndefined(z.string().optional()),
});
export const createAgentSchema = {
  body: z.object({
    nik: z.string().length(16, "NIK harus tepat 16 karakter"),
    nama: z.string().min(3, "Nama Agent minimal 3 karakter"),
    noHp: z.string().min(9, "Nomor HP minimal 9 karakter"),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    alamat: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(AgentStatus).optional()),
    type: emptyAsUndefined(z.nativeEnum(AgentType).optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    feeMarketingPct: emptyAsUndefined(
      z.coerce.number().min(0).max(100, "Persentase maksimal 100").optional(),
    ),
    potonganPph: emptyAsUndefined(
      z.coerce.number().min(0).max(100, "Persentase maksimal 100").optional(),
    ),
    pics: emptyAsUndefined(z.array(picSchema).optional()),
  }),
};
export const updateAgentSchema = {
  params: z.object({ id: z.string().regex(/^\d+$/, "ID harus berupa angka") }),
  body: z.object({
    nik: emptyAsUndefined(
      z.string().length(16, "NIK harus tepat 16 karakter").optional(),
    ),
    nama: emptyAsUndefined(z.string().min(3).optional()),
    noHp: emptyAsUndefined(z.string().min(9).optional()),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    alamat: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(AgentStatus).optional()),
    type: emptyAsUndefined(z.nativeEnum(AgentType).optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    feeMarketingPct: emptyAsUndefined(
      z.coerce.number().min(0).max(100).optional(),
    ),
    potonganPph: emptyAsUndefined(z.coerce.number().min(0).max(100).optional()),
    pics: emptyAsUndefined(z.array(picSchema).optional()),
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
  query: cursorPaginationQuerySchema,
};
