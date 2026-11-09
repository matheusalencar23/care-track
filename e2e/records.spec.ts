import { expect, fakePatient, fakeRecord, test } from "./fixtures";

const activeId = "0b6f1c2a-1111-4000-8000-000000000001";
const manyRecordsId = "0b6f1c2a-1111-4000-8000-000000000002";
const archivedId = "0b6f1c2a-1111-4000-8000-000000000003";

test.use({
  apiOptions: {
    signedIn: true,
    patients: [
      fakePatient({ id: activeId, name: "José Antônio Pereira" }),
      fakePatient({ id: manyRecordsId, name: "Maria das Dores" }),
      fakePatient({ id: archivedId, name: "Benedita Ramos", archivedAt: "2026-10-01T12:00:00.000Z" }),
    ],
    records: [
      ...Array.from({ length: 25 }, (_, index) =>
        fakeRecord({
          id: `0b6f1c2a-8888-4000-8000-${String(index).padStart(12, "0")}`,
          patientId: manyRecordsId,
          content: `Evolução número ${25 - index}.`,
        }),
      ),
      fakeRecord({
        id: "0b6f1c2a-9999-4000-8000-000000000001",
        patientId: archivedId,
        content: "Registro guardado.",
      }),
    ],
  },
});

test("salva um registro e ele aparece na linha do tempo com a autoria", async ({ page, api, cspViolations }) => {
  await page.goto(`/pacientes/${activeId}`);
  const section = page.getByRole("region", { name: "Histórico" });
  await expect(section.getByText("Nenhum registro neste histórico.")).toBeVisible();

  const field = section.getByRole("textbox", { name: "Novo registro" });
  await field.fill("  Curativo trocado.\nSem sinais de infecção.  ");
  await section.getByRole("button", { name: "Salvar registro" }).click();

  await expect(page.getByText("Registro salvo.")).toBeVisible();
  await expect(field).toHaveValue("");
  await expect(field).toBeFocused();

  const item = section.getByRole("listitem");
  await expect(item).toContainText("Ana Souza");
  await expect(item).toContainText("COREN-SP 123456");
  await expect(item).toContainText("Curativo trocado.");
  expect(api.createdRecords).toEqual([{ content: "Curativo trocado.\nSem sinais de infecção." }]);
  expect(new URL(page.url()).search).toBe("");
  expect(cspViolations).toEqual([]);
});

test("carrega os registros anteriores ao rolar até o fim da lista", async ({ page, api }) => {
  await page.goto(`/pacientes/${manyRecordsId}`);
  const section = page.getByRole("region", { name: "Histórico" });
  const items = section.getByRole("listitem");

  await expect(items.first()).toContainText("Evolução número 25.");
  await expect(items).toHaveCount(20);

  await section.getByRole("button", { name: "Carregar registros anteriores" }).scrollIntoViewIfNeeded();

  await expect(items).toHaveCount(25);
  await expect(items.last()).toContainText("Evolução número 1.");
  await expect(section.getByRole("button", { name: "Carregar registros anteriores" })).toBeHidden();
  expect(api.count(`GET /patients/${manyRecordsId}/records`)).toBe(2);
});

test("anula um registro, que sai da linha do tempo e aparece nos anulados", async ({ page, api, cspViolations }) => {
  await page.goto(`/pacientes/${manyRecordsId}`);
  const section = page.getByRole("region", { name: "Histórico" });
  const items = section.getByRole("listitem");
  await expect(items.first()).toContainText("Evolução número 25.");

  await section.getByRole("button", { name: /^Anular registro de / }).first().click();
  const dialog = page.getByRole("dialog", { name: "Anular registro?" });
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await expect(dialog).toContainText("Evolução número 25.");

  await dialog.getByRole("radio", { name: "Outro motivo" }).check();
  await dialog.getByRole("button", { name: "Anular" }).click();
  await expect(dialog.getByText("Descreva o motivo da anulação")).toBeVisible();

  await dialog.getByRole("textbox", { name: "Descrição" }).fill("Lançado no horário errado");
  await dialog.getByRole("button", { name: "Anular" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Registro anulado.")).toBeVisible();
  await expect(section.getByRole("heading", { name: "Registros", exact: true })).toBeFocused();
  await expect(items.first()).toContainText("Evolução número 24.");
  expect(api.voidedRecords).toEqual([{ reason: "other", details: "Lançado no horário errado" }]);

  await section.getByRole("button", { name: "Anulados" }).click();

  await expect(items).toHaveCount(1);
  await expect(items).toContainText("Evolução número 25.");
  await expect(items).toContainText("Motivo: Outro motivo");
  await expect(items).toContainText("Lançado no horário errado");
  await expect(section.getByRole("button", { name: /^Anular registro/ })).toHaveCount(0);
  expect(cspViolations).toEqual([]);
});

test("cancelar a anulação devolve o foco ao botão e não envia nada", async ({ page, api }) => {
  await page.goto(`/pacientes/${manyRecordsId}`);
  const section = page.getByRole("region", { name: "Histórico" });
  const opener = section.getByRole("button", { name: /^Anular registro de / }).first();

  await opener.click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(opener).toBeFocused();
  expect(api.voidedRecords).toEqual([]);
});

test("paciente arquivado mostra os registros, mas não aceita novos", async ({ page }) => {
  await page.goto(`/pacientes/${archivedId}`);
  const section = page.getByRole("region", { name: "Histórico" });

  await expect(section.getByText("Registro guardado.")).toBeVisible();
  await expect(section.getByRole("textbox")).toHaveCount(0);
  await expect(section.getByRole("button", { name: "Salvar registro" })).toHaveCount(0);
  await expect(section.getByRole("button", { name: /^Anular registro/ })).toHaveCount(0);
});

test("arquivar com texto não salvo preserva o texto e reativar permite salvar", async ({ page, api }) => {
  await page.goto(`/pacientes/${activeId}`);
  const section = page.getByRole("region", { name: "Histórico" });
  const field = section.getByRole("textbox", { name: "Novo registro" });
  await field.fill("Texto ainda não salvo");

  await page.getByRole("button", { name: "Arquivar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Arquivar" }).click();

  await expect(section.getByRole("alert")).toContainText("este texto ainda não foi salvo");
  await expect(field).toHaveValue("Texto ainda não salvo");
  await expect(field).not.toBeEditable();
  await expect(section.getByRole("button", { name: "Salvar registro" })).toBeDisabled();

  await page.getByRole("button", { name: "Reativar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Reativar" }).click();

  await expect(section.getByRole("alert")).toHaveCount(0);
  await section.getByRole("button", { name: "Salvar registro" }).click();

  await expect(section.getByRole("listitem")).toContainText("Texto ainda não salvo");
  expect(api.createdRecords).toEqual([{ content: "Texto ainda não salvo" }]);
});
