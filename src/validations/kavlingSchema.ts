import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { offsetPaginationQuerySchema } from "./paginationSchema.js";
import { UnitStatus, JenisKavling } from "@prisma/client";

export const createKavlingSchema = {
  body: z.object({
    perumahanId: z.coerce.number().int().positive("Perumahan ID wajib diisi"),
    blok: z
      .string()
      .min(1, "Blok wajib diisi")
      .max(10, "Blok maksimal 10 karakter"),
    nomorUnit: z
      .string()
      .min(1, "Nomor unit wajib diisi")
      .max(10, "Nomor unit maksimal 10 karakter"),
    namaTipe: z
      .string()
      .min(1, "Nama tipe wajib diisi")
      .max(50, "Nama tipe maksimal 50 karakter"),
    luasBangunan: z.coerce.number().min(0),
    luasTanah: z.coerce.number().min(0),
    hargaDasar: z.coerce.number().min(0),
    jenisKavling: emptyAsUndefined(z.nativeEnum(JenisKavling).optional()),
    status: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
    rekeningTujuanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    filePbg: emptyAsUndefined(
      z.string().max(255, "Nama file maksimal 255 karakter").optional(),
    ),
    fileSertifikatTanah: emptyAsUndefined(
      z.string().max(255, "Nama file maksimal 255 karakter").optional(),
    ),
    fileNopPbb: emptyAsUndefined(
      z.string().max(255, "Nama file maksimal 255 karakter").optional(),
    ),
    jumlahSertifikatTanah: emptyAsUndefined(
      z.coerce.number().int().min(1).max(5).optional(),
    ),
  }),
};

export const updateKavlingSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    perumahanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    blok: emptyAsUndefined(
      z.string().min(1).max(10, "Blok maksimal 10 karakter").optional(),
    ),
    nomorUnit: emptyAsUndefined(
      z.string().min(1).max(10, "Nomor unit maksimal 10 karakter").optional(),
    ),
    namaTipe: emptyAsUndefined(
      z.string().min(1).max(50, "Nama tipe maksimal 50 karakter").optional(),
    ),
    luasBangunan: emptyAsUndefined(z.coerce.number().min(0).optional()),
    luasTanah: emptyAsUndefined(z.coerce.number().min(0).optional()),
    hargaDasar: emptyAsUndefined(z.coerce.number().min(0).optional()),
    jenisKavling: emptyAsUndefined(z.nativeEnum(JenisKavling).optional()),
    status: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
    rekeningTujuanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    filePbg: emptyAsUndefined(
      z.string().max(255, "Nama file maksimal 255 karakter").optional(),
    ),
    fileSertifikatTanah: emptyAsUndefined(
      z.string().max(255, "Nama file maksimal 255 karakter").optional(),
    ),
    fileNopPbb: emptyAsUndefined(
      z.string().max(255, "Nama file maksimal 255 karakter").optional(),
    ),
    jumlahSertifikatTanah: emptyAsUndefined(
      z.coerce.number().int().min(1).max(5).optional(),
    ),
  }),
};

export const getKavlingPaginatedSchema = {
  query: offsetPaginationQuerySchema.extend({
    perumahanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    status: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
    jenisKavling: emptyAsUndefined(z.nativeEnum(JenisKavling).optional()),
  }),
};

export const uploadKavlingDocumentSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
    docType: z.enum(["filePbg", "fileSertifikatTanah", "fileNopPbb"]),
  }),
};

export const uploadKavlingSertifikatTambahanSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
    urutan: z.string().regex(/^[2-9]$/, "Urutan sertifikat tambahan minimal 2"),
    docType: z.enum(["filePbg", "fileSertifikatTanah", "fileNopPbb"]),
  }),
};
