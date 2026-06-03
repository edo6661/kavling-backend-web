import type { Prisma } from "@prisma/client";

export function normalizeTagihanFileBuktiList(
  fileBuktiList: Prisma.JsonValue | null | undefined,
  fileBukti: string | null | undefined,
): string[] {
  if (Array.isArray(fileBuktiList)) {
    return fileBuktiList.filter(
      (item): item is string => typeof item === "string" && item.trim() !== "",
    );
  }
  const single = fileBukti?.trim();
  return single ? [single] : [];
}

export function collectTagihanFileBuktiUrls(
  fileBukti: string | null | undefined,
  fileBuktiList?: string[] | null,
): string[] {
  const fromList = fileBuktiList?.filter((url) => url.trim() !== "") ?? [];
  if (fromList.length > 0) return [...new Set(fromList)];
  const single = fileBukti?.trim();
  return single ? [single] : [];
}
