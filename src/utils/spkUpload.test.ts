import { describe, it, expect } from "vitest";
import { getSpkUploadBuffers } from "./spkUpload.js";
import type { Request } from "express";

describe("getSpkUploadBuffers", () => {
  it("membaca fileSpk dan fileRab dari upload.fields", () => {
    const spkBuffer = Buffer.from("spk");
    const rabBuffer = Buffer.from("rab");
    const req = {
      files: {
        fileSpk: [{ buffer: spkBuffer }],
        fileRab: [{ buffer: rabBuffer }],
      },
    } as unknown as Request;

    expect(getSpkUploadBuffers(req)).toEqual({
      fileSpkBuffer: spkBuffer,
      fileRabBuffer: rabBuffer,
    });
  });

  it("tetap membaca fileSpk dari upload.single untuk kompatibilitas", () => {
    const spkBuffer = Buffer.from("spk");
    const req = {
      file: { fieldname: "fileSpk", buffer: spkBuffer },
    } as unknown as Request;

    expect(getSpkUploadBuffers(req)).toEqual({
      fileSpkBuffer: spkBuffer,
      fileRabBuffer: undefined,
    });
  });

  it("mengembalikan undefined jika tidak ada file", () => {
    const req = {} as Request;
    expect(getSpkUploadBuffers(req)).toEqual({
      fileSpkBuffer: undefined,
      fileRabBuffer: undefined,
    });
  });
});
