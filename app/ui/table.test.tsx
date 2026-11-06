import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Table, { type TableColumn } from "./table";

interface Row {
  id: string;
  name: string;
  birthDate: string;
}

const columns: TableColumn<Row>[] = [
  { header: "Nome", cell: (row) => row.name },
  { header: "Nascimento", cell: (row) => row.birthDate },
];

const rows: Row[] = [
  { id: "1", name: "Maria", birthDate: "15/03/1950" },
  { id: "2", name: "João", birthDate: "01/01/1980" },
];

describe("Table", () => {
  it("renderiza cabeçalhos e linhas", () => {
    render(
      <Table caption="Pacientes" columns={columns} rows={rows} getRowKey={(row) => row.id} />,
    );

    const table = screen.getByRole("table", { name: "Pacientes" });
    const [, ...bodyRows] = within(table).getAllByRole("row");

    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Nome",
      "Nascimento",
    ]);
    expect(bodyRows.map((row) => row.textContent)).toEqual([
      "Maria15/03/1950",
      "João01/01/1980",
    ]);
  });

  it("dá a cada célula o nome da coluna, usado no layout de cartão", () => {
    render(
      <Table caption="Pacientes" columns={columns} rows={rows} getRowKey={(row) => row.id} />,
    );

    expect(screen.getByRole("cell", { name: "Maria" })).toHaveAttribute("data-label", "Nome");
  });

  it("mostra linhas de carregamento no lugar dos dados", () => {
    render(
      <Table
        caption="Pacientes"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        isLoading
        loadingRows={3}
      />,
    );

    const table = screen.getByRole("table");

    expect(table).toHaveAttribute("aria-busy", "true");
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(screen.queryByText("Maria")).not.toBeInTheDocument();
  });
});
