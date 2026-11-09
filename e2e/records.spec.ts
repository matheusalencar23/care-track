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

test("paciente arquivado mostra os registros, mas não aceita novos", async ({ page }) => {
  await page.goto(`/pacientes/${archivedId}`);
  const section = page.getByRole("region", { name: "Histórico" });

  await expect(section.getByText("Registro guardado.")).toBeVisible();
  await expect(section.getByRole("textbox")).toHaveCount(0);
  await expect(section.getByRole("button", { name: "Salvar registro" })).toHaveCount(0);
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
