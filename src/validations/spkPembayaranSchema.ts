import { z } from "zod";

const terminJenis = z.enum(["TERMIN_55", "TERMIN_100", "RETENSI"]);

const upahBarisSchema = z.object({
  tukangId: z.coerce.number().int().positive().optional().nullable(),
  nik: z.string().trim().min(1).max(20),
  nama: z.string().trim().min(1).max(150),
  nominal: z.coerce.number().nonnegative().optional(),
});

const kasbonBarisSchema = z.object({
  namaSupplier: z
    .string()
    .trim()
    .max(200)
    .transform((s) => (s ? s : "-")),
  keterangan: z.string().trim().min(1).max(500),
  tanggalPo: z.coerce.date(),
  nominal: z.coerce.number().positive(),
  fotoBon: z.string().trim().url().max(500).optional().nullable(),
});

export const createSpkPembayaranSchema = {
  params: z.object({
    spkId: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      jenis: z.enum(["TERMIN_55", "TERMIN_100", "RETENSI", "KASBON", "UPAH"]),
      keterangan: z.string().trim().min(1).max(500).optional(),
      nominal: z.coerce.number().positive().optional(),
      tanggalPo: z.coerce.date().optional(),
      tanggalDari: z.coerce.date().optional(),
      tanggalSampai: z.coerce.date().optional(),
      baris: z.array(upahBarisSchema).optional(),
      kasbonBaris: z.array(kasbonBarisSchema).optional(),
      /** Total upah tukang (jenis UPAH) */
      upahNominal: z.coerce.number().positive().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.jenis === "KASBON") {
        if (data.kasbonBaris?.length) {
          if (!data.kasbonBaris.length) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Minimal satu baris kasbon wajib diisi",
              path: ["kasbonBaris"],
            });
          }
        } else {
          if (!data.keterangan) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Keterangan kasbon wajib diisi",
              path: ["keterangan"],
            });
          }
          if (data.nominal == null || data.nominal <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Nominal kasbon wajib dan harus lebih dari 0",
              path: ["nominal"],
            });
          }
          if (!data.tanggalPo) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tanggal PO wajib diisi",
              path: ["tanggalPo"],
            });
          }
        }
      } else if (data.jenis === "UPAH") {
        if (!data.tanggalDari) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tanggal dari wajib diisi",
            path: ["tanggalDari"],
          });
        }
        if (!data.tanggalSampai) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tanggal sampai wajib diisi",
            path: ["tanggalSampai"],
          });
        }
        if (
          data.tanggalDari &&
          data.tanggalSampai &&
          data.tanggalDari > data.tanggalSampai
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tanggal dari tidak boleh setelah tanggal sampai",
            path: ["tanggalSampai"],
          });
        }
        if (!data.baris?.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Minimal satu baris tukang wajib diisi",
            path: ["baris"],
          });
        }
        if (data.upahNominal == null || data.upahNominal <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Total upah tukang wajib dan harus lebih dari 0",
            path: ["upahNominal"],
          });
        }
      } else if (!terminJenis.safeParse(data.jenis).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jenis pembayaran tidak valid",
          path: ["jenis"],
        });
      }
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

export const addBuktiSpkPembayaranSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

export const removeBuktiSpkPembayaranSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    buktiUrl: z.string().trim().url(),
  }),
};

export const setBsiCmsDilaporkanSchema = {
  body: z.object({
    ids: z.array(z.coerce.number().int().positive()).min(1),
    dilaporkan: z.boolean(),
  }),
};

export const updateSpkKasbonSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      keterangan: z.string().trim().min(1).max(500).optional(),
      nominal: z.coerce.number().positive().optional(),
      tanggalPo: z.coerce.date().optional(),
      kasbonBaris: z.array(kasbonBarisSchema).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.kasbonBaris?.length) {
        if (!data.kasbonBaris.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Minimal satu baris kasbon wajib diisi",
            path: ["kasbonBaris"],
          });
        }
        return;
      }
      if (!data.keterangan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Keterangan kasbon wajib diisi",
          path: ["keterangan"],
        });
      }
      if (data.nominal == null || data.nominal <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nominal kasbon wajib dan harus lebih dari 0",
          path: ["nominal"],
        });
      }
      if (!data.tanggalPo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal PO wajib diisi",
          path: ["tanggalPo"],
        });
      }
    }),
};

export const updateSpkUpahSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      tanggalDari: z.coerce.date(),
      tanggalSampai: z.coerce.date(),
      baris: z.array(upahBarisSchema).min(1),
      upahNominal: z.coerce.number().positive(),
    })
    .superRefine((data, ctx) => {
      if (data.tanggalDari > data.tanggalSampai) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal dari tidak boleh setelah tanggal sampai",
          path: ["tanggalSampai"],
        });
      }
    }),
};
