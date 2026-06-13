import { describe, expect, it } from "vitest";
import { isTagihanNominalLocked } from "./tagihanNominalLock.js";

describe("isTagihanNominalLocked", () => {
  it("returns true for LUNAS", () => {
    expect(isTagihanNominalLocked("LUNAS")).toBe(true);
  });

  it("returns false for BELUM_BAYAR and MENUNGGU_KONFIRMASI", () => {
    expect(isTagihanNominalLocked("BELUM_BAYAR")).toBe(false);
    expect(isTagihanNominalLocked("MENUNGGU_KONFIRMASI")).toBe(false);
  });
});
