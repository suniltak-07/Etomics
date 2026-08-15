import { ApiError, ErrorCode, mapHttpStatusToCode } from "@/lib/api/errors";

export const AUTH_TOKEN_KEY = "etomics_token";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientOptions {
  baseUrl?: string;
  /** Explicit token override (SSR / server actions). */
  token?: string | null;
  defaultHeaders?: HeadersInit;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
  token?: string | null;
  /** Skip JSON parsing (rare); default false */
  raw?: boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

export function getAuthToken(explicit?: string | null): string | null {
  if (explicit !== undefined) {
    return explicit;
  }

  if (!isBrowser()) {
    return null;
  }

  try {
    const fromStorage = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (fromStorage) return fromStorage;
  } catch {
    // localStorage may be unavailable (private mode / SSR hydration edge)
  }

  return readCookie(AUTH_TOKEN_KEY);
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, unknown>,
): string {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = new URL(
    isAbsolute
      ? path
      : `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`,
    isBrowser() ? window.location.origin : "http://localhost",
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
      } else if (typeof value === "object") {
        url.searchParams.set(key, JSON.stringify(value));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return isAbsolute || isBrowser()
    ? url.toString()
    : `${url.pathname}${url.search}`;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text || null;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string | null;
  private readonly defaultHeaders: HeadersInit;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.token = options.token;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  async get<T>(
    path: string,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("GET", path, undefined, query, options);
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("POST", path, body, undefined, options);
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("PUT", path, body, undefined, options);
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("PATCH", path, body, undefined, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, undefined, undefined, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<T> {
    const token = getAuthToken(
      options.token !== undefined ? options.token : this.token,
    );

    const headers = new Headers(this.defaultHeaders);
    if (options.headers) {
      const extra = new Headers(options.headers);
      extra.forEach((value, key) => headers.set(key, value));
    }

    if (body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = buildUrl(this.baseUrl, path, query);

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options.signal,
        credentials: "same-origin",
      });
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : "Network request failed",
        0,
        ErrorCode.NETWORK_ERROR,
      );
    }

    const payload = await parseBody(response);

    if (!response.ok) {
      throw ApiError.fromResponse(payload, response.status);
    }

    return payload as T;
  }
}

export const apiClient = new ApiClient();

export function createApiClient(options?: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}

/** Convenience helpers that use the shared client instance */
export const api = {
  get: <T>(
    path: string,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ) => apiClient.get<T>(path, query, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiClient.post<T>(path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiClient.put<T>(path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiClient.patch<T>(path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiClient.delete<T>(path, options),
};

export { mapHttpStatusToCode };
