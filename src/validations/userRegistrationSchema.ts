import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";

const zStringIndo = (name: string) =>
  z.string({
    message: `${name} harus berupa teks`,
  });

export const adminFullRegisterSchema = {
  body: z.object({
    name: zStringIndo("Nama").min(3, "Nama minimal 3 karakter"),
    nik: zStringIndo("NIK").min(10, "NIK minimal 10 karakter"),
    role: zStringIndo("Role").min(1, "Role wajib diisi").toUpperCase(),
    perusahaanId: emptyAsUndefined(
      z
        .string({ message: "Format ID Perusahaan tidak valid" })
        .cuid("Format ID Perusahaan tidak valid")
        .optional(),
    ),
    email: emptyAsUndefined(
      z
        .string({ message: "Email harus berupa teks" })
        .email("Format email tidak valid")
        .optional(),
    ),
    password: emptyAsUndefined(
      z
        .string({ message: "Password harus berupa teks" })
        .min(6, "Password minimal 6 karakter")
        .optional(),
    ),
    status: emptyAsUndefined(
      z
        .enum(["TETAP", "TIDAK_TETAP"], {
          message: "Status tidak valid",
        })
        .optional(),
    ),
    alamat: emptyAsUndefined(z.string().optional()),
    statusPerkawinan: emptyAsUndefined(z.string().optional()),
  }),
};

export const adminPartialRegisterSchema = {
  body: z.object({
    name: zStringIndo("Nama").min(3, "Nama minimal 3 karakter"),
    nik: zStringIndo("NIK").min(10, "NIK minimal 10 karakter"),
    role: zStringIndo("Role").min(1, "Role wajib diisi").toUpperCase(),
    perusahaanId: emptyAsUndefined(
      z
        .string({ message: "Format ID Perusahaan tidak valid" })
        .cuid("Format ID Perusahaan tidak valid")
        .optional(),
    ),
    email: emptyAsUndefined(
      z
        .string({ message: "Email harus berupa teks" })
        .email("Format email tidak valid")
        .optional(),
    ),
    password: emptyAsUndefined(
      z
        .string({ message: "Password harus berupa teks" })
        .min(6, "Password minimal 6 karakter")
        .optional(),
    ),
    status: emptyAsUndefined(
      z
        .enum(["TETAP", "TIDAK_TETAP"], {
          message: "Status tidak valid",
        })
        .optional(),
    ),
    alamat: emptyAsUndefined(z.string().optional()),
    statusPerkawinan: emptyAsUndefined(z.string().optional()),
  }),
};

export const mandorRegisterWorkerSchema = {
  body: z.object({
    name: zStringIndo("Nama").min(3, "Nama minimal 3 karakter"),
    nik: zStringIndo("NIK").min(10, "NIK minimal 10 karakter"),
    role: emptyAsUndefined(z.string().toUpperCase().optional()),
    perusahaanId: emptyAsUndefined(
      z
        .string({ message: "Format ID Perusahaan tidak valid" })
        .cuid("Format ID Perusahaan tidak valid")
        .optional(),
    ),
    alamat: emptyAsUndefined(z.string().optional()),
    statusPerkawinan: emptyAsUndefined(z.string().optional()),
  }),
};

export const mandorUpdateFaceSchema = {
  params: z.object({
    id: z
      .string({
        message: "ID tidak valid",
      })
      .cuid("Format ID User tidak valid"),
  }),
};
