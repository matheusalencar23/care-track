import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Input from "./input";

describe("Input", () => {
  it("liga o rótulo ao campo", () => {
    render(<Input label="E-mail" />);

    expect(screen.getByLabelText("E-mail")).toBeInstanceOf(HTMLInputElement);
  });

  it("descreve o campo com a dica e o erro", () => {
    render(<Input label="CPF" hint="Opcional" error="CPF inválido" />);

    const input = screen.getByLabelText("CPF");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Opcional CPF inválido");
  });

  it("não marca o campo como inválido sem erro", () => {
    render(<Input label="Nome" />);

    const input = screen.getByLabelText("Nome");

    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });
});
