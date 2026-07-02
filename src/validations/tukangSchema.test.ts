import { describe, expect, it } from "vitest";
import { upsertTukangSchema } from "./tukangSchema.js";

const baseBody = {
  nik: "3201234567890123",
  nama: "Budi Santoso",
  sudahMenikah: false,
  jumlahAnak: 0,
};

describe("upsertTukangSchema", () => {
  it("accepts requests without ktp (existing API compat)", () => {
    const parsed = upsertTukangSchema.body.parse(baseBody);
    expect(parsed.ktp).toBeUndefined();
  });

  it("accepts valid optional ktp", () => {
    const parsed = upsertTukangSchema.body.parse({
      ...baseBody,
      ktp: "3201234567890124",
    });
    expect(parsed.ktp).toBe("3201234567890124");
  });

  it("accepts null or empty ktp to clear value", () => {
    expect(upsertTukangSchema.body.parse({ ...baseBody, ktp: null }).ktp).toBeNull();
    expect(upsertTukangSchema.body.parse({ ...baseBody, ktp: "" }).ktp).toBe("");
  });

  it("rejects invalid ktp length", () => {
    expect(() =>
      upsertTukangSchema.body.parse({ ...baseBody, ktp: "12345" }),
    ).toThrow();
  });

  it("still validates marital fields", () => {
    expect(() =>
      upsertTukangSchema.body.parse({
        nik: "3201234567890123",
        nama: "Budi",
        sudahMenikah: true,
      }),
    ).toThrow();
  });
});
