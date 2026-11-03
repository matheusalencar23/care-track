export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
  }
}

/** A API responde 422 quando o token de um link enviado por e-mail é inválido, expirado ou já usado. */
export function isInvalidTokenError(err: unknown) {
  return err instanceof ApiError && err.statusCode === 422;
}
