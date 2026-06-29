import { z } from "zod";

export const NIK_DIGIT_LENGTH = 16;
export const NIK_DIGITS_MESSAGE = "NIK harus tepat 16 digit angka";

export const requiredNikDigitsSchema = z
  .string()
  .trim()
  .regex(/^\d{16}$/, NIK_DIGITS_MESSAGE);

export const optionalNikDigitsSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || /^\d{16}$/.test(val), NIK_DIGITS_MESSAGE);

export const emptyOrNikDigitsSchema = z.union([
  z.literal(""),
  z.string().trim().regex(/^\d{16}$/, NIK_DIGITS_MESSAGE),
]);
