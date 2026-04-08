import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "./hashing";

describe("Hashing Utils", () => {
  it("harus menghasilkan hash yang berbeda dari plain text", async () => {
    const password = "password";
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed).toHaveLength(60);
  });

  it("harus return TRUE jika password cocok dengan hash", async () => {
    const password = "rahasia-negara";
    const hashed = await hashPassword(password);

    const isValid = await comparePassword(password, hashed);
    expect(isValid).toBe(true);
  });

  it("harus return FALSE jika password salah", async () => {
    const password = "rahasia-negara";
    const hashed = await hashPassword(password);

    const isValid = await comparePassword("salah-password", hashed);
    expect(isValid).toBe(false);
  });
});
