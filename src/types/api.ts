export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  details?:
    Record<string, unknown> | Array<{ field?: string; message: string }>;
  statusCode?: number;
}

export type SortOrder = "asc" | "desc";

export interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | number | boolean | string[] | undefined>;
}
