import { z } from "zod";

export const uploadKodeBillingPphSchema = {
  body: z.object({
    customerId: z.coerce.number().int().positive(),
    penjualanId: z.coerce.number().int().positive(),
    pdfPassword: z.string().optional(),
  }),
};

export const getKodeBillingPphPaginatedSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    status: z.enum(["MENUNGGU_BAYAR", "SUDAH_BAYAR", "ALL"]).optional(),
    customerId: z.coerce.number().int().positive().optional(),
    penjualanId: z.coerce.number().int().positive().optional(),
    orderBy: z.string().optional(),
  }),
};

export const kodeBillingPphIdParamsSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};
