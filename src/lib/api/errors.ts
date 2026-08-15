export type HttpStatusCode =
  400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503 | number;

export const ErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_GATEWAY: "BAD_GATEWAY",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type ApiErrorDetails =
  | Record<string, unknown>
  | Array<{ field?: string; message: string }>
  | undefined;

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ApiErrorDetails;
  readonly success = false as const;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ErrorCode.INTERNAL_ERROR,
    details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      success: false as const,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }

  static fromResponse(body: unknown, statusCode: number): ApiError {
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const nested =
        record.error && typeof record.error === "object"
          ? (record.error as Record<string, unknown>)
          : null;
      const message =
        typeof record.message === "string"
          ? record.message
          : typeof nested?.message === "string"
            ? nested.message
            : mapHttpStatusToMessage(statusCode);
      const code =
        typeof record.code === "string"
          ? record.code
          : typeof nested?.code === "string"
            ? nested.code
            : mapHttpStatusToCode(statusCode);
      const details = record.details as ApiErrorDetails;
      return new ApiError(message, statusCode, code, details);
    }

    return new ApiError(
      mapHttpStatusToMessage(statusCode),
      statusCode,
      mapHttpStatusToCode(statusCode),
    );
  }
}

export function mapHttpStatusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 502:
      return ErrorCode.BAD_GATEWAY;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    case 500:
      return ErrorCode.INTERNAL_ERROR;
    default:
      if (status >= 500) return ErrorCode.INTERNAL_ERROR;
      if (status >= 400) return ErrorCode.BAD_REQUEST;
      return ErrorCode.UNKNOWN;
  }
}

export function mapHttpStatusToMessage(status: number): string {
  switch (status) {
    case 400:
      return "Bad request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Resource not found";
    case 409:
      return "Conflict";
    case 422:
      return "Validation failed";
    case 429:
      return "Too many requests";
    case 500:
      return "Internal server error";
    case 502:
      return "Bad gateway";
    case 503:
      return "Service unavailable";
    default:
      return `Request failed with status ${status}`;
  }
}

export function mapHttpStatus(status: number): {
  code: ErrorCode;
  message: string;
} {
  return {
    code: mapHttpStatusToCode(status),
    message: mapHttpStatusToMessage(status),
  };
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
