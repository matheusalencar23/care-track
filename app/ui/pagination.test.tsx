import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Pagination from "./pagination";

function visiblePages() {
  const list = screen.getByRole("list");

  return within(list)
    .getAllByRole("listitem", { hidden: true })
    .map((item) => item.textContent);
}

describe("Pagination", () => {
  it("não aparece com uma página só", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("mostra todas as páginas quando são poucas", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);

    expect(visiblePages()).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("encurta com reticências quando são muitas", () => {
    render(<Pagination page={10} totalPages={20} onPageChange={() => {}} />);

    expect(visiblePages()).toEqual(["1", "…", "9", "10", "11", "…", "20"]);
  });

  it("mantém cinco páginas seguidas perto das pontas", () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={20} onPageChange={() => {}} />,
    );

    expect(visiblePages()).toEqual(["1", "2", "3", "4", "5", "…", "20"]);

    rerender(<Pagination page={20} totalPages={20} onPageChange={() => {}} />);

    expect(visiblePages()).toEqual(["1", "…", "16", "17", "18", "19", "20"]);
  });

  it("marca a página atual e navega", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    await userEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    await userEvent.click(screen.getByRole("button", { name: "Página 5" }));

    expect(onPageChange.mock.calls).toEqual([[4], [2], [5]]);
  });

  it("desabilita anterior na primeira página e próxima na última", () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={3} onPageChange={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeEnabled();

    rerender(<Pagination page={3} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });
});
