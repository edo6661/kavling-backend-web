import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { offsetPaginationQuerySchema } from "./paginationSchema.js";
import { emptyOrNikDigitsSchema, requiredNikDigitsSchema } from "./nikSchema.js";

export const createCustomerSchema = {
  body: z.object({
    nikKtp: emptyOrNikDigitsSchema.optional(),
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
    nikKtp: emptyAsUndefined(requiredNikDigitsSchema.optional()),
    nama: emptyAsUndefined(z.string().min(3).optional()),
    noHp: emptyAsUndefined(z.string().min(9).optional()),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    pekerjaan: emptyAsUndefined(z.string().optional()),
    perusahaan: emptyAsUndefined(z.string().optional()),
    bank: emptyAsUndefined(z.string().optional()),
    alamatKoresponden: emptyAsUndefined(z.string().optional()),
    alamatKtp: emptyAsUndefined(z.string().min(5).optional()),
    alamatTinggal: emptyAsUndefined(z.string().optional()),
    dokumenLainnya: emptyAsUndefined(z.any().optional()),
  }),
};

export const getCustomersPaginatedSchema = {
  query: offsetPaginationQuerySchema,
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
