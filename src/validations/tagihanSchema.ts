import { z } from "zod";
import { TagihanTujuan } from "@prisma/client";
import { emptyAsUndefined } from "./emptySchema.js";
import {
  cursorPaginationQuerySchema,
  offsetPaginationQuerySchema,
} from "./paginationSchema.js";
import { PaymentStatus } from "@prisma/client";

export const createTagihanSchema = {
  body: z.object({
    customerId: z.coerce.number().int().positive("Customer wajib dipilih"),
    penjualanId: z.coerce
      .number()
      .int()
      .positive("Data Penjualan (Kavling) wajib dipilih"),
    pembayaran: z.string().min(3, "Keterangan pembayaran minimal 3 karakter"),
    nominal: z.coerce.number().positive("Nominal harus lebih dari 0"),
    jatuhTempo: z.string().min(1, "Jatuh tempo wajib diisi"),
    reminderBerikutnya: emptyAsUndefined(z.string().optional()),
    tujuan: z.nativeEnum(TagihanTujuan).optional(),
  }),
};

export const updateTagihanSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    pembayaran: emptyAsUndefined(z.string().min(3).optional()),
    nominal: emptyAsUndefined(z.coerce.number().positive().optional()),
    jatuhTempo: emptyAsUndefined(z.string().optional()),
    reminderBerikutnya: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(PaymentStatus).optional()),
    tujuan: emptyAsUndefined(z.nativeEnum(TagihanTujuan).optional()),
  }),
};

export const getTagihansPaginatedSchema = {
  query: offsetPaginationQuerySchema.extend({
    customerId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    penjualanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    status: emptyAsUndefined(z.nativeEnum(PaymentStatus).optional()),
  }),
};

export const uploadBuktiByNoTagihanSchema = {
  params: z.object({
    noTagihan: z.string().min(1, "Nomor Tagihan wajib diisi"),
  }),
};
