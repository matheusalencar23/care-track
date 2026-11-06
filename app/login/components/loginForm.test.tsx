import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { login } from "@/services/auth.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import LoginForm from "./loginForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services/auth.service", () => ({
  login: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn() },
}));

beforeEach(() => {
  push.mockReset();
  vi.mocked(login).mockReset();
});

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText("E-mail"), email);
  await userEvent.type(screen.getByLabelText("Senha"), password);
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginForm", () => {
  it("mostra os erros de validação sem chamar a API", async () => {
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit("nao-e-email", "curta");

    expect(await screen.findByText("Email inválido")).toBeVisible();
    expect(screen.getByText("Senha muito curta")).toBeVisible();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(login).not.toHaveBeenCalled();
  });

  it("entra e vai para a lista de pacientes", async () => {
    vi.mocked(login).mockResolvedValue({});
    const { queryClient } = renderWithQueryClient(<LoginForm />);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await fillAndSubmit("enfermeira@exemplo.com", "senha-segura");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/pacientes"));
    expect(vi.mocked(login).mock.calls[0][0]).toEqual({
      email: "enfermeira@exemplo.com",
      password: "senha-segura",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["auth", "me"] });
  });

  it("mostra o erro da API e continua no login", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError("Credenciais inválidas!", { statusCode: 400, code: "INVALID_CREDENTIALS" }),
    );
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit("enfermeira@exemplo.com", "senha-errada");

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  it("desabilita o botão enquanto entra", async () => {
    vi.mocked(login).mockReturnValue(new Promise(() => {}));
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit("enfermeira@exemplo.com", "senha-segura");

    expect(await screen.findByRole("button", { name: "Entrando..." })).toBeDisabled();
  });
});
