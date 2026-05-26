import { z } from "zod";

const terminJenis = z.enum(["TERMIN_55", "TERMIN_100", "RETENSI"]);

export const createSpkPembayaranSchema = {
  params: z.object({
    spkId: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      jenis: z.enum(["TERMIN_55", "TERMIN_100", "RETENSI", "KASBON"]),
      keterangan: z.string().trim().min(1).max(500).optional(),
      nominal: z.coerce.number().positive().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.jenis === "KASBON") {
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
