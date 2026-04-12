import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import type { PaymentMethod } from "@prisma/client";

export const createPenjualanSchema = {
  body: z.object({
    noIdentitas: z.string().min(16, "NIK minimal 16 karakter"),
    nama: z.string().min(3, "Nama wajib diisi"),
    noTelepon: z.string().min(9, "No Telepon wajib diisi"),
    alamat: z.string().min(5, "Alamat wajib diisi"),
    perusahaan: emptyAsUndefined(z.string().optional()),
    alamatKoresponden: emptyAsUndefined(z.string().optional()),

    perumahan: z.string().min(1, "Perumahan wajib diisi"),
    blok: z.string().min(1, "Blok wajib diisi").max(10, "Blok Max 10 Karakter"),
    nomorUnit: z
      .string()
      .min(1, "Nomor unit wajib diisi")
      .max(10, "No Unit Max 10 Karakter"),
    tipe: z.string().min(1, "Tipe kavling wajib diisi"),
    luasBangunan: z.coerce.number().min(0),
    luasTanah: z.coerce.number().min(0),

    tanggal: z.string().datetime().or(z.string().min(1)),
    hargaJual: z.coerce.number().min(1, "Harga jual tidak valid"),
    hargaPromosi: emptyAsUndefined(z.coerce.number().min(0).optional()),
    diskonPenjualan: emptyAsUndefined(z.coerce.number().min(0).optional()),
    dp: emptyAsUndefined(z.coerce.number().min(0).optional()),
    bookingFee: emptyAsUndefined(z.coerce.number().min(0).optional()),
    caraPembayaran: z.string().transform((val) => {
      const formatted = val.toUpperCase().replace(/\s+/g, "_");
      if (["CASH_KERAS", "CASH_BERTAHAP", "KPR"].includes(formatted)) {
        return formatted as PaymentMethod;
      }
      throw new Error("Cara pembayaran tidak valid");
    }),
    bank: emptyAsUndefined(z.string().optional()),
    nilaiPengajuanKpr: emptyAsUndefined(z.coerce.number().min(0).optional()),

    agent: z.string().min(1, "Agent wajib diisi"),
  }),
};

export const getPenjualanPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};
