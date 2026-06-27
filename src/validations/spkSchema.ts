import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";

const parseJsonNumberArray = (val: string, ctx: z.RefinementCtx, fieldLabel: string) => {
  try {
    const parsed = JSON.parse(val) as unknown;
    const result = z.array(z.coerce.number().int().positive()).safeParse(parsed);
    if (!result.success) {
      ctx.addIssue({ code: "custom", message: `Format ${fieldLabel} tidak valid` });
      return z.NEVER;
    }
    return result.data;
  } catch {
    ctx.addIssue({ code: "custom", message: `Format ${fieldLabel} tidak valid` });
    return z.NEVER;
  }
};

const optionalNumberArrayField = (fieldLabel: string) =>
  z
    .union([
      z.array(z.coerce.number().int().positive()),
      z.string().transform((val, ctx) => parseJsonNumberArray(val, ctx, fieldLabel)),
    ])
    .optional();

const spkJenisField = z.enum(["RUMAH", "INFRASTRUKTUR"]).optional().default("RUMAH");

const spkTerminSchemeField = z.enum(["RUMAH_DEFAULT", "INFRA_20_6", "INFRA_30_4"]).optional();

const spkBodyBase = z.object({
  noSpk: z.string().min(1, "Nomor SPK wajib diisi"),
  jenis: spkJenisField,
  terminScheme: spkTerminSchemeField,
  tanggalSpk: z.coerce.date(),
  judulPekerjaan: z.string().min(1, "Judul pekerjaan wajib diisi"),
  nilaiKontrak: z.coerce.number().positive("Nilai kontrak harus lebih dari 0"),
  bankRekeningPtId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
  zonaId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
  nilaiSudahDibayarkan: emptyAsUndefined(z.coerce.number().nonnegative().optional()),
  sisaNilaiKontrak: emptyAsUndefined(z.coerce.number().nonnegative().optional()),
  progressOverride: emptyAsUndefined(z.coerce.number().min(0).max(100).optional()),
  notesPekerjaan: emptyAsUndefined(z.string().optional()),
  jatuhTempo: emptyAsUndefined(z.coerce.date().optional()),
  mandorId: z.coerce.number().int().positive(),
  kavlingIds: optionalNumberArrayField("kavlingIds"),
  pekerjaanInfraIds: optionalNumberArrayField("pekerjaanInfraIds"),
});

const validateSpkByJenis = (
  data: {
    jenis?: "RUMAH" | "INFRASTRUKTUR";
    kavlingIds?: number[] | undefined;
    zonaId?: number | undefined;
    pekerjaanInfraIds?: number[] | undefined;
  },
  ctx: z.RefinementCtx,
  mode: "create" | "update",
) => {
  const jenis = data.jenis ?? "RUMAH";

  if (jenis === "RUMAH") {
    if (mode === "create" && (!data.kavlingIds || data.kavlingIds.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Minimal 1 kavling wajib dipilih",
        path: ["kavlingIds"],
      });
    }
    if (data.kavlingIds && data.kavlingIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Minimal 1 kavling wajib dipilih",
        path: ["kavlingIds"],
      });
    }
    return;
  }

  if (mode === "create" && !data.zonaId) {
    ctx.addIssue({
      code: "custom",
      message: "Zona wajib dipilih untuk SPK infrastruktur",
      path: ["zonaId"],
    });
  }
  if (
    mode === "create" &&
    (!data.pekerjaanInfraIds || data.pekerjaanInfraIds.length === 0)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Minimal 1 pekerjaan infrastruktur wajib dipilih",
      path: ["pekerjaanInfraIds"],
    });
  }
  if (data.pekerjaanInfraIds && data.pekerjaanInfraIds.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Minimal 1 pekerjaan infrastruktur wajib dipilih",
      path: ["pekerjaanInfraIds"],
    });
  }
};

export const createSpkSchema = {
  body: spkBodyBase.superRefine((data, ctx) => {
    validateSpkByJenis(data, ctx, "create");
  }),
};

export const updateSpkSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: spkBodyBase
    .omit({ jenis: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Minimal satu field harus diisi untuk update",
    })
    .superRefine((data, ctx) => {
      if (
        data.kavlingIds !== undefined ||
        data.zonaId !== undefined ||
        data.pekerjaanInfraIds !== undefined
      ) {
        validateSpkByJenis(
          {
            jenis: data.zonaId !== undefined || data.pekerjaanInfraIds !== undefined
              ? "INFRASTRUKTUR"
              : "RUMAH",
            kavlingIds: data.kavlingIds,
            zonaId: data.zonaId,
            pekerjaanInfraIds: data.pekerjaanInfraIds,
          },
          ctx,
          "update",
        );
      }
    }),
};

export const getSpkPaginatedSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(500).default(10),
    cursor: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    jenis: z.enum(["RUMAH", "INFRASTRUKTUR"]).optional(),
    orderBy: z.enum(["mandor:asc", "mandor:desc", "id:desc"]).optional(),
  }),
};

export const getSpkByIdSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
};
