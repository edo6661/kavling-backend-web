import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import { Role } from "@prisma/client";

export const upsertRolePermissionSchema = {
  body: z.object({
    role: z.nativeEnum(Role, {
      error: () => ({ message: "Role tidak valid" }),
    }),
    resource: z.string().min(2, "Nama resource minimal 2 karakter"),
    canCreate: z.boolean(),
    canRead: z.boolean(),
    canUpdate: z.boolean(),
    canDelete: z.boolean(),
  }),
};

export const getRolePermissionsSchema = {
  query: z.object({
    role: emptyAsUndefined(z.nativeEnum(Role).optional()),
    resource: emptyAsUndefined(z.string().optional()),
  }),
};

export const rolePermissionIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
};
