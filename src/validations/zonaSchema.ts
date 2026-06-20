import { z } from "zod";

export const createZonaSchema = {
  body: z.object({
    nama: z.string().min(1, "Nama zona wajib diisi"),
    hgb: z.string().min(1, "HGB wajib diisi"),
    luas: z.string().min(1, "Luas wajib diisi"),
    deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  }),
};

export const updateZonaSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: createZonaSchema.body.partial().refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
  }),
};

export const getZonaListSchema = {
  query: z.object({
    search: z.string().optional(),
  }),
};
