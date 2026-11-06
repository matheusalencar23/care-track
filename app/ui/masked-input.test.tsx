import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import MaskedInput from "./masked-input";

function ControlledCpf({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <MaskedInput
      label="CPF"
      mask="cpf"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("MaskedInput", () => {
  it("mostra a máscara e entrega só os dígitos", async () => {
    const onChange = vi.fn();
    render(<ControlledCpf onChange={onChange} />);
    const input = screen.getByLabelText("CPF");

    await userEvent.type(input, "52998224725");

    expect(input).toHaveValue("529.982.247-25");
    expect(onChange).toHaveBeenLastCalledWith("52998224725");
  });

  it("ignora letras", async () => {
    const onChange = vi.fn();
    render(<ControlledCpf onChange={onChange} />);
    const input = screen.getByLabelText("CPF");

    await userEvent.type(input, "12a3");

    expect(input).toHaveValue("123");
    expect(onChange).toHaveBeenLastCalledWith("123");
  });

  it("formata um valor recebido de fora", () => {
    render(<MaskedInput label="Telefone" mask="phone" value="11987654321" />);

    expect(screen.getByLabelText("Telefone")).toHaveValue("(11) 98765-4321");
  });
});
