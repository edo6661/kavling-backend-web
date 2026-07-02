import { describe, expect, it } from "vitest";
import { findBlockedKavlingTransferSource } from "./spkKavlingTransfer.js";

describe("findBlockedKavlingTransferSource", () => {
  it("mengizinkan transfer sebagian kavling dari SPK sumber", () => {
    const blocked = findBlockedKavlingTransferSource(
      [{ spkId: 15, noSpk: "015/SPK", transferringKavlingIds: [101] }],
      new Map([[15, 4]]),
    );
    expect(blocked).toBeNull();
  });

  it("memblokir transfer jika SPK sumber akan kehilangan semua kavling", () => {
    const blocked = findBlockedKavlingTransferSource(
      [{ spkId: 27, noSpk: "027/SPK", transferringKavlingIds: [201] }],
      new Map([[27, 1]]),
    );
    expect(blocked?.spkId).toBe(27);
    expect(blocked?.noSpk).toBe("027/SPK");
  });

  it("memblokir jika jumlah transfer sama dengan total kavling di SPK sumber", () => {
    const blocked = findBlockedKavlingTransferSource(
      [
        {
          spkId: 15,
          noSpk: "015/SPK",
          transferringKavlingIds: [101, 102, 103, 104],
        },
      ],
      new Map([[15, 4]]),
    );
    expect(blocked?.spkId).toBe(15);
  });

  it("mengizinkan transfer dari beberapa SPK sumber sekaligus", () => {
    const blocked = findBlockedKavlingTransferSource(
      [
        { spkId: 14, noSpk: "014/SPK", transferringKavlingIds: [301] },
        { spkId: 15, noSpk: "015/SPK", transferringKavlingIds: [302] },
      ],
      new Map([
        [14, 2],
        [15, 4],
      ]),
    );
    expect(blocked).toBeNull();
  });
});
