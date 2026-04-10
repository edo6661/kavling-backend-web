import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";

export const createCustomerSchema = {
  body: z.object({
    nikKtp: z.string().length(16, "NIK harus tepat 16 karakter"),
    nama: z.string().min(3, "Nama minimal 3 karakter"),
    noHp: z.string().min(9, "Nomor HP minimal 9 karakter"),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    pekerjaan: emptyAsUndefined(z.string().optional()),
    perusahaan: emptyAsUndefined(z.string().optional()),
    bank: emptyAsUndefined(z.string().optional()),
    alamatKoresponden: emptyAsUndefined(z.string().optional()),
    alamatKtp: z.string().min(5, "Alamat KTP minimal 5 karakter"),
    alamatTinggal: emptyAsUndefined(z.string().optional()),
  }),
};

export const updateCustomerSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    userId: emptyAsUndefined(z.coerce.number().int().positive().optional()),
    nikKtp: emptyAsUndefined(
      z.string().length(16, "NIK harus tepat 16 karakter").optional(),
    ),
    nama: emptyAsUndefined(z.string().min(3).optional()),
    noHp: emptyAsUndefined(z.string().min(9).optional()),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    pekerjaan: emptyAsUndefined(z.string().optional()),
    perusahaan: emptyAsUndefined(z.string().optional()),
    bank: emptyAsUndefined(z.string().optional()),
    alamatKoresponden: emptyAsUndefined(z.string().optional()),
    alamatKtp: emptyAsUndefined(z.string().min(5).optional()),
    alamatTinggal: emptyAsUndefined(z.string().optional()),
  }),
};

export const getCustomersPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};

export const generateAccountSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID Customer harus berupa angka"),
  }),
  body: z.object({
    password: z
      .string()
      .min(6, "Password minimal 6 karakter untuk akun Customer"),
  }),
};
