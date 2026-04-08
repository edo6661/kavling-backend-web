import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import { PaymentStatus } from "@prisma/client";

export const createSprPaymentSchema = {
  body: z.object({
    sprId: z.coerce.number().int().positive("ID SPR tidak valid"),
    keterangan: z.string().min(2, "Keterangan minimal 2 karakter (misal: DP)"),
    jatuhTempo: z.coerce.date({
      error: "Tanggal jatuh tempo wajib diisi",
    }),
    nilai: z.coerce.number().positive("Nilai tagihan harus lebih dari 0"),
  }),
};

export const updateSprPaymentSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    keterangan: emptyAsUndefined(z.string().min(2).optional()),
    jatuhTempo: emptyAsUndefined(z.coerce.date().optional()),
    nilai: emptyAsUndefined(z.number().positive().optional()),
    statusPembayaran: emptyAsUndefined(z.nativeEnum(PaymentStatus).optional()),
    tanggalBayar: emptyAsUndefined(z.coerce.date().optional()),
  }),
};

export const getSprPaymentPaginatedSchema = {
  query: cursorPaginationQuerySchema.extend({
    sprId: emptyAsUndefined(z.coerce.number().optional()),
    statusPembayaran: emptyAsUndefined(z.nativeEnum(PaymentStatus).optional()),
  }),
};

export const verifySprPaymentSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    isApproved: z.boolean({
      error: "Status approval (isApproved) wajib diisi",
    }),
  }),
};
