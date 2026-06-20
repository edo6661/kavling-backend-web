import { z } from "zod";
import { PekerjaanInfraKategori } from "@prisma/client";

const kategoriSchema = z.nativeEnum(PekerjaanInfraKategori);

export const createPekerjaanInfraSchema = {
  body: z.object({
    nama: z.string().min(1, "Nama pekerjaan wajib diisi"),
    kategori: kategoriSchema.optional().default(PekerjaanInfraKategori.LAINNYA),
    urutan: z.coerce.number().int().nonnegative().optional(),
  }),
};

export const updatePekerjaanInfraSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: createPekerjaanInfraSchema.body.partial().refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
  }),
};
