import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RadioGroup from "./radio-group";

const options = [
  { value: "a", label: "Opção A" },
  { value: "b", label: "Opção B", disabled: true },
];

describe("RadioGroup", () => {
  it("liga o grupo ao rótulo, à dica e ao erro", () => {
    render(<RadioGroup label="Escolha" name="x" options={options} hint="Uma dica" error="Um erro" />);

    const group = screen.getByRole("radiogroup", { name: "Escolha" });

    expect(group).toHaveAccessibleDescription("Uma dica Um erro");
    expect(group).toHaveAttribute("aria-invalid", "true");
  });

  it("entrega o valor escolhido e respeita a opção desativada", async () => {
    const onChange = vi.fn();
    render(<RadioGroup label="Escolha" name="x" options={options} value="a" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: "Opção A" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Opção B" })).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: "Opção B" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
