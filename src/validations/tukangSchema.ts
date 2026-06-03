import { z } from "zod";

export const getTukangListSchema = {
  query: z.object({
    search: z.string().optional(),
  }),
};

export const upsertTukangSchema = {
  body: z.object({
    nik: z.string().trim().min(1).max(20),
    nama: z.string().trim().min(1).max(150),
  }),
};
