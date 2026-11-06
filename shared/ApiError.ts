export interface ValidationIssue {
  location: string;
  path: string;
  message: string;
}

interface ApiErrorDetails {
  statusCode?: number;
  code?: string;
  requestId?: string;
  errors?: ValidationIssue[];
}

export class ApiError extends Error {
  public readonly statusCode?: number;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly errors: ValidationIssue[];

  constructor(message: string, details: ApiErrorDetails = {}) {
    super(message);
    this.statusCode = details.statusCode;
    this.code = details.code;
    this.requestId = details.requestId;
    this.errors = details.errors ?? [];
  }
}

export function hasErrorCode(err: unknown, code: string) {
  return err instanceof ApiError && err.code === code;
}

export function isInvalidTokenError(err: unknown) {
  return hasErrorCode(err, "INVALID_LINK_TOKEN");
}
