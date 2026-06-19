import { describe, it, expect } from "vitest";
import {
  collectAgentPencairanInvoiceUrls,
  normalizeAgentPencairanInvoiceList,
} from "./agentPencairanInvoice.js";

describe("agentPencairanInvoice utils", () => {
  it("mengambil dari fileInvoiceList jika ada", () => {
    expect(
      normalizeAgentPencairanInvoiceList(
        ["https://a/1.pdf", "https://a/2.pdf"],
        "https://legacy.pdf",
      ),
    ).toEqual(["https://a/1.pdf", "https://a/2.pdf"]);
  });

  it("fallback ke fileInvoice tunggal jika list kosong", () => {
    expect(
      normalizeAgentPencairanInvoiceList(null, "https://legacy.pdf"),
    ).toEqual(["https://legacy.pdf"]);
  });

  it("collect menggabungkan tanpa duplikat", () => {
    expect(
      collectAgentPencairanInvoiceUrls("https://legacy.pdf", [
        "https://legacy.pdf",
        "https://new.pdf",
      ]),
    ).toEqual(["https://legacy.pdf", "https://new.pdf"]);
  });
});
