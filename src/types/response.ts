export interface CursorPaginationMeta {
  nextCursor: string | number | null;
  hasNextPage: boolean;
}

export interface CursorPaginatedData<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  error?: unknown;
}
