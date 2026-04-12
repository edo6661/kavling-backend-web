import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";

export const getFeeAgentsPaginatedSchema = {
  query: cursorPaginationQuerySchema.extend({
    agentId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    penjualanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
  }),
};

export const updateFeeAgentSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    bookingNominal: emptyAsUndefined(z.coerce.number().min(0).optional()),
    bookingTanggal: emptyAsUndefined(z.string().optional()),
    closingNominal: emptyAsUndefined(z.coerce.number().min(0).optional()),
    closingTanggal: emptyAsUndefined(z.string().optional()),
    marketingNominal: emptyAsUndefined(z.coerce.number().min(0).optional()),
    marketingTanggal: emptyAsUndefined(z.string().optional()),
  }),
};
