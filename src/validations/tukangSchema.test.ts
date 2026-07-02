import { describe, expect, it } from "vitest";
import { upsertTukangSchema } from "./tukangSchema.js";

const baseBody = {
  nik: "3201234567890123",
  nama: "Budi Santoso",
  sudahMenikah: false,
  jumlahAnak: 0,
};

describe("upsertTukangSchema", () => {
  it("accepts requests without fileKtp (existing API compat)", () => {
    const parsed = upsertTukangSchema.body.parse(baseBody);
    expect(parsed.nik).toBe(baseBody.nik);
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
