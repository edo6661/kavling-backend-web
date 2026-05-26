import { z } from "zod";

export const createSpkPembayaranSchema = {
  params: z.object({
    spkId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    jenis: z.enum(["TERMIN_55", "TERMIN_100", "RETENSI"]),
  }),
};

export const getSpkPembayaranBySpkSchema = {
  params: z.object({
    spkId: z.coerce.number().int().positive(),
  }),
};

export const getSpkPembayaranPaginatedSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(600).default(20),
    status: z.enum(["MENUNGGU_PEMBAYARAN", "SUDAH_DIBAYAR", "ALL"]).optional(),
    search: z.string().optional(),
  }),
};

export const bayarSpkPembayaranSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    tanggalPembayaran: z.coerce.date().optional(),
  }),
};
