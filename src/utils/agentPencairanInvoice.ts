import type { Prisma } from "@prisma/client";

export const MAX_AGENT_PENCAIRAN_INVOICE_FILES = 10;

export function normalizeAgentPencairanInvoiceList(
  fileInvoiceList: Prisma.JsonValue | null | undefined,
  fileInvoice: string | null | undefined,
): string[] {
  if (Array.isArray(fileInvoiceList)) {
    return fileInvoiceList.filter(
      (item): item is string => typeof item === "string" && item.trim() !== "",
    );
  }
  const single = fileInvoice?.trim();
  return single ? [single] : [];
}

export function collectAgentPencairanInvoiceUrls(
  fileInvoice: string | null | undefined,
  fileInvoiceList?: string[] | null,
): string[] {
  const fromList = fileInvoiceList?.filter((url) => url.trim() !== "") ?? [];
  if (fromList.length > 0) return [...new Set(fromList)];
  const single = fileInvoice?.trim();
  return single ? [single] : [];
}
