import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { validateCustomTerminConfig } from "../domain/spk/spkTerminScheme.js";

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

const customTerminStepSchema = z.object({
  urutan: z.coerce.number().int().positive(),
  label: z.string().min(1, "Nama termin wajib diisi"),
  shortLabel: z.string().optional(),
  kontrakFraction: z.coerce.number().positive().max(1),
  minProgress: z.coerce.number().min(0).max(100),
  isRetensi: z.boolean().optional(),
});

const terminConfigField = z
  .union([
    z.array(customTerminStepSchema),
    z.string().transform((val, ctx) => {
      const trimmed = val.trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed === null) return null;
        const res = z.array(customTerminStepSchema).safeParse(parsed);
        if (!res.success) {
          ctx.addIssue({ code: "custom", message: "Format konfigurasi termin custom tidak valid" });
          return z.NEVER;
        }
        return res.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Format konfigurasi termin custom tidak valid" });
        return z.NEVER;
      }
    }),
  ])
  .optional()
  .nullable();

const spkJenisField = z.enum(["RUMAH", "INFRASTRUKTUR"]).optional().default("RUMAH");

const spkTerminSchemeField = z
  .enum([
    "RUMAH_DEFAULT",
    "RUMAH_25_4",
    "RUMAH_3_TERMIN",
    "INFRA_20_6",
    "INFRA_30_4",
    "CUSTOM",
  ])
  .optional();

const spkBodyBase = z.object({
  noSpk: z.string().min(1, "Nomor SPK wajib diisi"),
  jenis: spkJenisField,
  terminScheme: spkTerminSchemeField,
  terminConfig: terminConfigField,
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

const validateSpkTerminConfig = (
  data: {
    terminScheme?: string | undefined;
    terminConfig?: any;
  },
  ctx: z.RefinementCtx,
) => {
  if (data.terminScheme === "CUSTOM") {
    if (!data.terminConfig || !Array.isArray(data.terminConfig) || data.terminConfig.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Konfigurasi termin custom wajib diisi jika memilih skema CUSTOM",
        path: ["terminConfig"],
      });
      return;
    }
    const check = validateCustomTerminConfig(data.terminConfig);
    if (!check.valid) {
      ctx.addIssue({
        code: "custom",
        message: check.message ?? "Konfigurasi termin custom tidak valid",
        path: ["terminConfig"],
      });
    }
  }
};

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
    validateSpkTerminConfig(data, ctx);
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
      validateSpkTerminConfig(data, ctx);
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
    statusApproval: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    orderBy: z.enum(["mandor:asc", "mandor:desc", "id:desc"]).optional(),
  }),
};

export const rejectSpkSchema = {
  body: z.object({
    catatanPenolakan: emptyAsUndefined(z.string().max(2000).optional()),
  }),
};

export const getSpkByIdSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
};
