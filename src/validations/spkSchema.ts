import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";

const kavlingIdsField = z
  .union([
    z.array(z.coerce.number().int().positive()),
    z.string().transform((val, ctx) => {
      try {
        const parsed = JSON.parse(val) as unknown;
        const result = z.array(z.coerce.number().int().positive()).safeParse(parsed);
        if (!result.success) {
          ctx.addIssue({ code: "custom", message: "Format kavlingIds tidak valid" });
          return z.NEVER;
        }
        return result.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Format kavlingIds tidak valid" });
        return z.NEVER;
      }
    }),
  ])
  .refine((val) => val.length > 0, { message: "Minimal 1 kavling wajib dipilih" });

const spkBodyBase = z.object({
  noSpk: z.string().min(1, "Nomor SPK wajib diisi"),
  tanggalSpk: z.coerce.date(),
  judulPekerjaan: z.string().min(1, "Judul pekerjaan wajib diisi"),
  nilaiKontrak: z.coerce.number().positive("Nilai kontrak harus lebih dari 0"),
  bankRekeningPtId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
  nilaiSudahDibayarkan: emptyAsUndefined(z.coerce.number().nonnegative().optional()),
  sisaNilaiKontrak: emptyAsUndefined(z.coerce.number().nonnegative().optional()),
  progressOverride: emptyAsUndefined(z.coerce.number().min(0).max(100).optional()),
  notesPekerjaan: emptyAsUndefined(z.string().optional()),
  jatuhTempo: emptyAsUndefined(z.coerce.date().optional()),
  mandorId: z.coerce.number().int().positive(),
  kavlingIds: kavlingIdsField,
});

export const createSpkSchema = {
  body: spkBodyBase,
};

export const updateSpkSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: spkBodyBase
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Minimal satu field harus diisi untuk update",
    }),
};

export const getSpkPaginatedSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(500).default(10),
    cursor: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    orderBy: z.enum(["mandor:asc", "mandor:desc", "id:desc"]).optional(),
  }),
};

export const getSpkByIdSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
};
