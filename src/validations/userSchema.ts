// src/validations/userSchema.ts
import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { cursorPaginationQuerySchema } from "./paginationSchema.js";
import { Role } from "@prisma/client";

export const getUsersPaginatedSchema = {
  query: cursorPaginationQuerySchema.extend({
    role: emptyAsUndefined(z.nativeEnum(Role).optional()),
    orderBy: emptyAsUndefined(
      z
        .string()
        .regex(
          /^(username|createdAt):(asc|desc)$/,
          "Format orderBy salah. Coba username:asc",
        )
        .transform((val) => {
          const parts = val.split(":");
          return { field: parts[0], direction: parts[1] as "asc" | "desc" };
        })
        .optional(),
    ),
  }),
};

export const userIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

export const updateUserSchema = {
  params: userIdParamSchema,
  body: z.object({
    username: emptyAsUndefined(
      z.string().min(3, "Username minimal 3 karakter").optional(),
    ),
    email: emptyAsUndefined(z.string().email("Format email salah").optional()),
    password: emptyAsUndefined(
      z.string().min(6, "Password minimal 6 karakter").optional(),
    ),
    role: emptyAsUndefined(z.nativeEnum(Role).optional()),
  }),
};
