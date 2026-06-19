import { describe, it, expect } from "vitest";
import { ajukanAgentPencairanSchema } from "./agentPencairanSchema.js";

describe("ajukanAgentPencairanSchema", () => {
  const parse = (body: Record<string, unknown>) =>
    ajukanAgentPencairanSchema.body.parse(body);

  it("mem-parse boolean multipart form (closing true, marketing false)", () => {
    expect(
      parse({
        feeAgentId: "12",
        includeClosing: "true",
        includeMarketing: "false",
      }),
    ).toEqual({
      feeAgentId: 12,
      includeClosing: true,
      includeMarketing: false,
    });
  });

  it("mem-parse boolean JSON body", () => {
    expect(
      parse({
        feeAgentId: 12,
        includeClosing: true,
        includeMarketing: false,
      }),
    ).toEqual({
      feeAgentId: 12,
      includeClosing: true,
      includeMarketing: false,
    });
  });

  it("mem-parse includeClosing false dari multipart", () => {
    expect(
      parse({
        feeAgentId: 1,
        includeClosing: "false",
        includeMarketing: "true",
      }),
    ).toEqual({
      feeAgentId: 1,
      includeClosing: false,
      includeMarketing: true,
    });
  });

  it("menolak jika tidak ada komponen yang dipilih", () => {
    expect(() =>
      parse({
        feeAgentId: 1,
        includeClosing: "false",
        includeMarketing: "false",
      }),
    ).toThrow();
  });
});
