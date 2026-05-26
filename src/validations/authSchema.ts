import { z } from "zod";
import { Role } from "@prisma/client";
import { emptyAsUndefined } from "./emptySchema.js";
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

export const customerLoginSchema = {
  body: z.object({
    username: z.string().min(1, "Username (No HP) wajib diisi"),
    password: z.string().min(1, "Password (NIK) wajib diisi"),
  }),
};

export const registerAgentSchema = {
  body: z.object({
    nik: z.string().length(16, "NIK harus tepat 16 karakter"),
    nama: z.string().min(3, "Nama Agent minimal 3 karakter"),
    noHp: z.string().min(9, "Nomor HP minimal 9 karakter"),
    email: z.string().email("Format email salah"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    alamat: emptyAsUndefined(z.string().optional()),
    type: emptyAsUndefined(z.enum(["PRIBADI", "PERUSAHAAN"]).optional()),
    namaBank: emptyAsUndefined(z.string().optional()),
    noRekening: emptyAsUndefined(z.string().optional()),
    atasNamaRekening: emptyAsUndefined(z.string().optional()),
    perusahaanAgentId: emptyAsUndefined(z.coerce.number().optional()),
    ttdData: emptyAsUndefined(z.string().optional()),
  }),
};

const selfMandorProfileSchema = z.object({
  namaBank: z.string().min(2, "Nama bank minimal 2 karakter"),
  noRekening: z.string().min(5, "Nomor rekening minimal 5 karakter"),
  atasNamaRekening: z.string().min(3, "Atas nama rekening minimal 3 karakter"),
});

export const updateSelfSchema = {
  body: z
    .object({
      username: emptyAsUndefined(
        z.string().min(3, "Username minimal 3 karakter").optional(),
      ),
      email: emptyAsUndefined(
        z.string().email("Format email tidak valid").optional(),
      ),
      password: emptyAsUndefined(
        z.string().min(6, "Password minimal 6 karakter").optional(),
      ),
      mandor: emptyAsUndefined(selfMandorProfileSchema.optional()),
    })
    .refine(
      (data) => data.username ?? data.email ?? data.password ?? data.mandor,
      {
        message:
          "Minimal salah satu data (username, email, password, atau rekening mandor) harus diisi",
      },
    ),
};
