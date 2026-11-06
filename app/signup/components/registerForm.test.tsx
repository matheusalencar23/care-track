import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TERMS_VERSION } from "@/lib/legal";
import { signup } from "@/services/auth.service";
import { renderWithQueryClient } from "@/test/render";
import RegisterForm from "./registerForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services/auth.service", () => ({
  signup: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const termsCheckbox = () =>
  screen.getByRole("checkbox", { name: /Li e aceito os Termos de Uso/ });

async function fillForm() {
  await userEvent.type(screen.getByLabelText("Nome"), "Ana Souza");
  await userEvent.type(screen.getByLabelText("E-mail"), "ana@exemplo.com");
  await userEvent.type(screen.getByLabelText("COREN"), "123456");
  await userEvent.selectOptions(screen.getByLabelText("UF"), "SP");
  await userEvent.type(screen.getByLabelText("Senha"), "senha-segura");
}

beforeEach(() => {
  push.mockReset();
  vi.mocked(signup).mockReset().mockResolvedValue({});
});

describe("RegisterForm", () => {
  it("exige o aceite dos termos", async () => {
    renderWithQueryClient(<RegisterForm />);
    await fillForm();

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(
      await screen.findByText(
        "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade",
      ),
    ).toBeVisible();
    expect(termsCheckbox()).toHaveAttribute("aria-invalid", "true");
    expect(termsCheckbox()).toHaveAccessibleDescription(
      "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade",
    );
    expect(signup).not.toHaveBeenCalled();
  });

  it("envia a versão dos termos aceita", async () => {
    renderWithQueryClient(<RegisterForm />);
    await fillForm();

    await userEvent.click(termsCheckbox());
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(vi.mocked(signup).mock.calls[0][0]).toEqual({
      name: "Ana Souza",
      email: "ana@exemplo.com",
      coren: "123456",
      corenState: "SP",
      password: "senha-segura",
      acceptedTermsVersion: TERMS_VERSION,
    });
  });

  it("abre os documentos em outra aba, sem perder o formulário", () => {
    renderWithQueryClient(<RegisterForm />);

    expect(screen.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
      "href",
      "/privacidade",
    );
  });
});
