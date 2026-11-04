interface ApiErrorDetails {
  statusCode?: number;
  code?: string;
  requestId?: string;
}

export class ApiError extends Error {
  public readonly statusCode?: number;
  public readonly code?: string;
  public readonly requestId?: string;

  constructor(message: string, details: ApiErrorDetails = {}) {
    super(message);
    this.statusCode = details.statusCode;
    this.code = details.code;
    this.requestId = details.requestId;
  }
}

export function hasErrorCode(err: unknown, code: string) {
  return err instanceof ApiError && err.code === code;
}

export function isInvalidTokenError(err: unknown) {
  return hasErrorCode(err, "INVALID_LINK_TOKEN");
}
