import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = {
  body: z.object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.nativeEnum(Role).default(Role.CUSTOMER),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi"),
  }),
};
