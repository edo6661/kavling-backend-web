import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";

const picNotarisSchema = z.object({
  nama: z.string().min(3, "Nama PIC minimal 3 karakter"),
  noHp: z.string().min(9, "Nomor HP PIC minimal 9 karakter"),
  alamat: emptyAsUndefined(z.string().optional()),
});

export const createNotarisSchema = {
  body: z.object({
    nama: z.string().min(3, "Nama Notaris minimal 3 karakter"),
    nomorKtp: emptyAsUndefined(z.string().optional()),
    nomorIjin: emptyAsUndefined(z.string().optional()),
    noHp: emptyAsUndefined(z.string().optional()),
    alamat: emptyAsUndefined(z.string().optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    biayaAjb: z.coerce.number().min(0, "Biaya AJB tidak boleh negatif"),
    pics: emptyAsUndefined(z.array(picNotarisSchema).optional()),
  }),
};

export const updateNotarisSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    nama: emptyAsUndefined(z.string().min(3).optional()),
    biayaAjb: emptyAsUndefined(z.coerce.number().min(0).optional()),
    nomorKtp: emptyAsUndefined(z.string().optional()),
    nomorIjin: emptyAsUndefined(z.string().optional()),
    noHp: emptyAsUndefined(z.string().optional()),
    alamat: emptyAsUndefined(z.string().optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    pics: emptyAsUndefined(z.array(picNotarisSchema).optional()),
  }),
};

export const getNotarisPaginatedSchema = {
  query: cursorPaginationQuerySchema,
};
