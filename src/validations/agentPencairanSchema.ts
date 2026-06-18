import { z } from "zod";

export const getAgentPencairanPaginatedSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(600).default(20),
    status: z.enum(["MENUNGGU_PEMBAYARAN", "SUDAH_DIBAYAR", "ALL"]).optional(),
    search: z.string().optional(),
    agentId: z.coerce.number().int().positive().optional(),
    feeAgentId: z.coerce.number().int().positive().optional(),
  }),
};

export const ajukanAgentPencairanSchema = {
  body: z.object({
    feeAgentId: z.coerce.number().int().positive(),
    tahap: z.enum(["PPJB", "AJB"]),
  }),
};

export const bayarAgentPencairanSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    tanggalPembayaran: z.coerce.date().optional(),
  }),
};

export const setAgentBsiCmsDilaporkanSchema = {
  body: z.object({
    ids: z.array(z.coerce.number().int().positive()).min(1),
    dilaporkan: z.boolean(),
  }),
};
