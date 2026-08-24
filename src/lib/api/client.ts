import {
  persistAuthSession,
  clearPersistedAuth,
} from "@/features/auth/persistSession";
import { ApiError, ErrorCode, mapHttpStatusToCode } from "@/lib/api/errors";
import {
  extractErrorCode,
  isAccessTokenExpired,
  isAccessTokenInvalid,
  isAuthenticationRequired,
} from "@/lib/auth/error-codes";
import { AUTH_TOKEN_COOKIE, type SessionUser } from "@/lib/auth/session";

export { AUTH_TOKEN_COOKIE };
export const AUTH_TOKEN_KEY = AUTH_TOKEN_COOKIE;

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
  /** Do not attempt a refresh-token retry after 401. */
  skipRefresh?: boolean;
}

function persistRotatedAccessToken(
  token: string,
  user: SessionUser,
  expiresIn?: number,
): void {
  persistAuthSession(user, token, expiresIn);
}

const SKIP_REFRESH_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/me",
];

function shouldAttemptRefresh(path: string): boolean {
  try {
    const pathname = path.startsWith("http")
      ? new URL(path).pathname
      : (path.split("?")[0] ?? path);
    return !SKIP_REFRESH_PATHS.some(
      (skip) => pathname === skip || pathname.endsWith(skip),
    );
  } catch {
    return true;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function rotateAccessToken(
  fetchImpl: typeof fetch,
): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetchImpl("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return null;
        const payload = (await response.json()) as {
          data?: {
            token?: string;
            user?: SessionUser;
            expiresIn?: number;
          };
        };
        const token = payload.data?.token;
        const user = payload.data?.user;
        if (!token || !user) return null;
        persistRotatedAccessToken(token, user, payload.data?.expiresIn);
        return token;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
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
    const fromStorage = window.localStorage.getItem(AUTH_TOKEN_COOKIE);
    if (fromStorage) return fromStorage;
  } catch {
    // localStorage may be unavailable (private mode / SSR hydration edge)
  }

  return readCookie(AUTH_TOKEN_COOKIE);
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

    if (response.status === 401) {
      const code = extractErrorCode(payload);

      if (
        (isAccessTokenInvalid(code) || isAuthenticationRequired(code)) &&
        isBrowser()
      ) {
        clearPersistedAuth();
      }

      if (
        isAccessTokenExpired(code) &&
        !options.skipRefresh &&
        isBrowser() &&
        shouldAttemptRefresh(path)
      ) {
        const nextToken = await rotateAccessToken(this.fetchImpl);
        if (nextToken) {
          return this.request<T>(method, path, body, query, {
            ...options,
            token: nextToken,
            skipRefresh: true,
          });
        }
        clearPersistedAuth();
      }
    }

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
