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

export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  summary?: Record<string, any>;
}

export interface OffsetPaginatedData<T> {
  items: T[];
  meta: OffsetPaginationMeta;
}
