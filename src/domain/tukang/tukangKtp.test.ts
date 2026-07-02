import { describe, expect, it } from "vitest";
import { buildKtpUpdateData, normalizeKtpForSave } from "./tukangKtp.js";

describe("normalizeKtpForSave", () => {
  it("returns null for empty or missing values", () => {
    expect(normalizeKtpForSave(undefined)).toBeNull();
    expect(normalizeKtpForSave(null)).toBeNull();
    expect(normalizeKtpForSave("")).toBeNull();
    expect(normalizeKtpForSave("   ")).toBeNull();
  });

  it("keeps only digits", () => {
    expect(normalizeKtpForSave("3201-2345-6789-0123")).toBe("3201234567890123");
  });
});

describe("buildKtpUpdateData", () => {
  it("skips update when ktp is omitted (backward compatible)", () => {
    expect(buildKtpUpdateData(undefined)).toEqual({});
  });

  it("clears ktp when explicitly sent as null or empty", () => {
    expect(buildKtpUpdateData(null)).toEqual({ ktp: null });
    expect(buildKtpUpdateData("")).toEqual({ ktp: null });
  });

  it("saves sanitized digits when provided", () => {
    expect(buildKtpUpdateData("3201234567890123")).toEqual({
      ktp: "3201234567890123",
    });
  });
});
