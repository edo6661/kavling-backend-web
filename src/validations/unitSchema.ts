import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import { UnitStatus } from "@prisma/client";

export const createUnitSchema = {
  body: z.object({
    namaPerumahan: z.string().min(3, "Nama perumahan minimal 3 karakter"),
    blok: z.string().min(1, "Blok wajib diisi"),
    nomorUnit: z.string().min(1, "Nomor unit wajib diisi"),
    tipe: emptyAsUndefined(z.string().optional()),
    luasTanah: emptyAsUndefined(z.coerce.number().min(1).optional()),
    luasBangunan: emptyAsUndefined(z.coerce.number().min(1).optional()),
    lantai: emptyAsUndefined(z.coerce.number().min(1).optional()),
    lokasiStrategis: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
  }),
};

export const updateUnitSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    namaPerumahan: emptyAsUndefined(
      z
        .string()
        .min(3, {
          error: "Minimal 3 karakter",
        })
        .optional(),
    ),
    blok: emptyAsUndefined(z.string().min(1).optional()),
    nomorUnit: emptyAsUndefined(z.string().min(1).optional()),
    tipe: emptyAsUndefined(z.string().optional()),
    luasTanah: emptyAsUndefined(z.coerce.number().min(1).optional()),
    luasBangunan: emptyAsUndefined(z.coerce.number().min(1).optional()),
    lantai: emptyAsUndefined(z.coerce.number().min(1).optional()),
    lokasiStrategis: emptyAsUndefined(z.string().optional()),
    status: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
  }),
};

export const getUnitsPaginatedSchema = {
  query: cursorPaginationQuerySchema.extend({
    status: emptyAsUndefined(z.nativeEnum(UnitStatus).optional()),
  }),
};
