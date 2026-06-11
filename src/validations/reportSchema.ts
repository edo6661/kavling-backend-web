import { z } from "zod";
import {
  PaymentMethod,
  PenjualanStatus,
  SpkPembayaranStatus,
} from "@prisma/client";
import { emptyAsUndefined } from "./emptySchema.js";

const dateOnlySchema = emptyAsUndefined(
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
);

export const getProgressProyekReportSchema = {
  query: z.object({
    perumahanId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    spkId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    blok: emptyAsUndefined(z.string().min(1).optional()),
    mandorId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
  }),
};

export const getKeuanganReportSchema = {
  query: z.object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    kategori: emptyAsUndefined(
      z.enum(["ALL", "SPK", "NOTARIS", "KPR", "MASUK"]).optional(),
    ),
    bsiCms: emptyAsUndefined(z.enum(["ALL", "SUDAH", "BELUM"]).optional()),
    status: emptyAsUndefined(
      z.enum(["ALL", "SUDAH_DIBAYAR", "MENUNGGU_PEMBAYARAN"]).optional(),
    ),
  }),
};

export const getPenjualanReportSchema = {
  query: z.object({
    perumahanId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    blok: emptyAsUndefined(z.string().min(1).optional()),
    status: emptyAsUndefined(
      z.union([z.nativeEnum(PenjualanStatus), z.literal("ALL")]).optional(),
    ),
    caraPembayaran: emptyAsUndefined(z.nativeEnum(PaymentMethod).optional()),
    agentId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
  }),
};

export const getRekapPembayaranReportSchema = {
  query: z.object({
    perumahanId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    blok: emptyAsUndefined(z.string().min(1).optional()),
    status: emptyAsUndefined(
      z.union([z.nativeEnum(PenjualanStatus), z.literal("ALL")]).optional(),
    ),
    caraPembayaran: emptyAsUndefined(z.nativeEnum(PaymentMethod).optional()),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    search: emptyAsUndefined(z.string().min(1).optional()),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
};

export const getMarketingReportSchema = {
  query: z.object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    agentId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    perusahaanAgentId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    perumahanId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
  }),
};

export const getBiayaProyekReportSchema = {
  query: z.object({
    perumahanId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    spkId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    blok: emptyAsUndefined(z.string().min(1).optional()),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    pembayaranStatus: emptyAsUndefined(
      z
        .union([z.nativeEnum(SpkPembayaranStatus), z.literal("ALL")])
        .optional(),
    ),
  }),
};
