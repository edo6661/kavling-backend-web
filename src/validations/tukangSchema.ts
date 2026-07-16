import { z } from "zod";
import { TUKANG_MAX_JUMLAH_ANAK } from "../domain/tukang/tukangMarital.js";

const tukangMaritalBodySchema = z
  .object({
    sudahMenikah: z.boolean(),
    jumlahAnak: z.coerce
      .number()
      .int()
      .min(0)
      .max(TUKANG_MAX_JUMLAH_ANAK)
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.sudahMenikah && (data.jumlahAnak === null || data.jumlahAnak === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Jumlah anak wajib diisi jika sudah menikah",
        path: ["jumlahAnak"],
      });
    }
  });

export const getTukangListSchema = {
  query: z.object({
    search: z.string().optional(),
  }),
};

export const upsertTukangSchema = {
  body: z
    .object({
      nik: z.string().trim().min(1).max(20),
      nama: z.string().trim().min(1).max(150),
      originalNik: z.string().trim().min(1).max(20).optional().nullable(),
      sudahMenikah: z.boolean().optional().nullable(),
      jumlahAnak: z.coerce
        .number()
        .int()
        .min(0)
        .max(TUKANG_MAX_JUMLAH_ANAK)
        .optional()
        .nullable(),
    })
    .superRefine((data, ctx) => {
      if (data.sudahMenikah === true && (data.jumlahAnak === null || data.jumlahAnak === undefined)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jumlah anak wajib diisi jika sudah menikah",
          path: ["jumlahAnak"],
        });
      }
    }),
};

export const uploadTukangKtpSchema = {
  params: z.object({
    nik: z.string().trim().min(1).max(20),
  }),
};

export const deleteTukangSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

export const tukangMaritalFieldsSchema = tukangMaritalBodySchema;
