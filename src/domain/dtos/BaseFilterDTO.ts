export interface BaseFilterDTO {
  search?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  orderBy?: { field: string; direction: "asc" | "desc" } | undefined;
}
