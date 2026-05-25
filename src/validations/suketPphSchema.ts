import { z } from "zod";

export const uploadSuketPphSchema = {
  body: z.object({
    customerId: z.coerce.number().int().positive(),
    penjualanId: z.coerce.number().int().positive(),
    pdfPassword: z.string().optional(),
  }),
};

export const suketPphPenjualanParamsSchema = {
  params: z.object({
    penjualanId: z.coerce.number().int().positive(),
  }),
};
