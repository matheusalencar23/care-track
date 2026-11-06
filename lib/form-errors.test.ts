import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/ApiError";
import { applyFieldErrors } from "./form-errors";

type Values = { name: string; cpf: string };

function validationError(errors: ApiError["errors"]) {
  return new ApiError("Dados inválidos.", { statusCode: 422, code: "VALIDATION_FAILED", errors });
}

describe("applyFieldErrors", () => {
  it("leva cada erro do corpo para o campo e foca o primeiro", () => {
    const setError = vi.fn();

    const handled = applyFieldErrors<Values>(
      validationError([
        { location: "body", path: "cpf", message: "CPF inválido" },
        { location: "body", path: "name", message: "O nome é obrigatório" },
      ]),
      setError,
      ["name", "cpf"],
    );

    expect(handled).toBe(true);
    expect(setError).toHaveBeenNthCalledWith(1, "cpf", { type: "server", message: "CPF inválido" }, { shouldFocus: true });
    expect(setError).toHaveBeenNthCalledWith(2, "name", { type: "server", message: "O nome é obrigatório" }, { shouldFocus: false });
  });

  it("avisa quando sobra erro sem campo correspondente", () => {
    const setError = vi.fn();

    const handled = applyFieldErrors<Values>(
      validationError([
        { location: "body", path: "cpf", message: "CPF inválido" },
        { location: "query", path: "page", message: "Página inválida" },
        { location: "body", path: "", message: "Corpo inválido" },
      ]),
      setError,
      ["name", "cpf"],
    );

    expect(handled).toBe(false);
    expect(setError).toHaveBeenCalledTimes(1);
  });

  it("ignora erros sem lista de campos", () => {
    const setError = vi.fn();

    expect(applyFieldErrors<Values>(new ApiError("Este registro já existe.", { code: "CONFLICT" }), setError, ["cpf"])).toBe(false);
    expect(applyFieldErrors<Values>(new Error("x"), setError, ["cpf"])).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
