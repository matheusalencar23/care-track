import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./confirm-dialog";

function renderDialog(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const view = render(
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title="Arquivar paciente"
      confirmLabel="Arquivar"
      pendingLabel="Arquivando..."
      tone="danger"
      {...props}
    >
      O prontuário continua guardado.
    </ConfirmDialog>,
  );

  return { ...view, onClose, onConfirm };
}

describe("ConfirmDialog", () => {
  it("abre com o título como nome acessível e foco em Cancelar", () => {
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Arquivar paciente" })).toHaveAttribute("open");
    expect(screen.getByText("O prontuário continua guardado.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it("confirma e cancela", async () => {
    const { onClose, onConfirm } = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("fecha com Esc", () => {
    const { onClose } = renderDialog();

    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha nem confirma de novo enquanto a ação está em andamento", () => {
    const { onClose } = renderDialog({ isPending: true });

    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Arquivando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Fechar" })).not.toBeInTheDocument();
  });

  it("fecha o <dialog> quando open passa a false", () => {
    const { rerender, onClose, onConfirm } = renderDialog();

    rerender(
      <ConfirmDialog
        open={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Arquivar paciente"
        confirmLabel="Arquivar"
      >
        O prontuário continua guardado.
      </ConfirmDialog>,
    );

    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });
});
