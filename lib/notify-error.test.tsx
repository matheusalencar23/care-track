import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { toast } from "react-toastify";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/ApiError";
import { notifyError } from "./notify-error";

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn() },
}));

function renderLastToast() {
  const content = vi.mocked(toast.error).mock.lastCall?.[0];
  render(typeof content === "string" ? <p>{content}</p> : (content as ReactElement));
}

describe("notifyError", () => {
  it("mostra a mensagem da API sem o código em erros 4xx", () => {
    notifyError(
      new ApiError("Este paciente está arquivado.", { statusCode: 409, requestId: "req-1" }),
    );
    renderLastToast();

    expect(screen.getByText("Este paciente está arquivado.")).toBeInTheDocument();
    expect(screen.queryByText(/Código para o suporte/)).not.toBeInTheDocument();
  });

  it("mostra o código da requisição em erros 5xx", () => {
    notifyError(
      new ApiError("Ocorreu um erro inesperado.", { statusCode: 500, requestId: "req-500" }),
    );
    renderLastToast();

    expect(screen.getByText(/Código para o suporte/)).toHaveTextContent("req-500");
  });

  it("usa uma mensagem genérica para erros que não vieram da API", () => {
    notifyError(new TypeError("x is undefined"));
    renderLastToast();

    expect(screen.getByText("Ocorreu um erro inesperado. Por favor, tente novamente.")).toBeInTheDocument();
    expect(screen.queryByText("x is undefined")).not.toBeInTheDocument();
  });
});
