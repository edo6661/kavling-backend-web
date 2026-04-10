import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import { UnitStatus } from "@prisma/client";

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
    hargaJual: z.coerce.number().min(0),
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
    hargaJual: emptyAsUndefined(z.coerce.number().min(0).optional()),
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
  }),
};

export const getKavlingPaginatedSchema = {
  query: cursorPaginationQuerySchema.extend({
    perumahanId: emptyAsUndefined(
      z.coerce.number().int().positive().optional(),
    ),
    status: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
  }),
};
