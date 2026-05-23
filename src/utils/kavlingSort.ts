export const parseNomorUnit = (val: string): number => {
  const n = Number.parseInt(String(val).trim(), 10);
  return Number.isFinite(n) ? n : 0;
};

export const compareKavlingBlokUnit = (
  a: { blok: string; nomorUnit: string },
  b: { blok: string; nomorUnit: string },
  direction: "asc" | "desc" = "asc",
): number => {
  const blokCmp = a.blok.localeCompare(b.blok, "id", {
    numeric: true,
    sensitivity: "base",
  });
  if (blokCmp !== 0) {
    return direction === "asc" ? blokCmp : -blokCmp;
  }
  const diff = parseNomorUnit(a.nomorUnit) - parseNomorUnit(b.nomorUnit);
  return direction === "asc" ? diff : -diff;
};

/** Mandor ditugaskan di atas, lalu urut blok & nomor unit. */
export const compareProgressProyekList = (
  a: { hasMandor: boolean; blok: string; nomorUnit: string },
  b: { hasMandor: boolean; blok: string; nomorUnit: string },
): number => {
  if (a.hasMandor !== b.hasMandor) {
    return a.hasMandor ? -1 : 1;
  }
  return compareKavlingBlokUnit(a, b, "asc");
};
