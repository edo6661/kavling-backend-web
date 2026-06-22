import { z } from "zod";

export const uploadFakturPajakPpnSchema = {
  body: z.object({
    customerId: z.coerce.number().int().positive(),
    penjualanId: z.coerce.number().int().positive(),
    sertifikatUrutan: z.coerce.number().int().min(1).max(5).optional(),
    pdfPassword: z.string().optional(),
  }),
};

export const fakturPajakPpnPenjualanParamsSchema = {
  params: z.object({
    penjualanId: z.coerce.number().int().positive(),
  }),
};

export const deleteFakturPajakPpnSchema = {
  params: z.object({
    penjualanId: z.coerce.number().int().positive(),
  }),
  query: z.object({
    sertifikatUrutan: z.coerce.number().int().min(1).max(5).optional(),
  }),
};
