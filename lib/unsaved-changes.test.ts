import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import {
  UNSAVED_CHANGES_MESSAGE,
  confirmLeave,
  guardUnsavedChanges,
  hasUnsavedChanges,
} from "./unsaved-changes";

const releases: (() => void)[] = [];

function guard() {
  const release = guardUnsavedChanges();
  releases.push(release);
  return release;
}

function link(href: string, attributes: Record<string, string> = {}) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = "Ir";
  for (const [name, value] of Object.entries(attributes)) {
    anchor.setAttribute(name, value);
  }
  document.body.append(anchor);
  return anchor;
}

function click(anchor: HTMLElement, init: MouseEventInit = {}) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  anchor.dispatchEvent(event);
  return event;
}

function beforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

let confirm: MockInstance<typeof window.confirm>;

beforeEach(() => {
  confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
});

afterEach(() => {
  releases.splice(0).forEach((release) => release());
  document.body.innerHTML = "";
});

describe("guardUnsavedChanges", () => {
  it("não faz nada sem alterações pendentes", () => {
    const event = click(link("/pacientes"));

    expect(hasUnsavedChanges()).toBe(false);
    expect(confirmLeave()).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(beforeUnload().defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("pede confirmação ao recarregar ou fechar a página", () => {
    guard();

    expect(beforeUnload().defaultPrevented).toBe(true);
  });

  it("bloqueia o link interno quando o usuário não confirma", () => {
    guard();
    const onClick = vi.fn();
    document.body.addEventListener("click", onClick);

    const event = click(link("/pacientes"));

    expect(confirm).toHaveBeenCalledWith(UNSAVED_CHANGES_MESSAGE);
    expect(event.defaultPrevented).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("deixa o link seguir quando o usuário confirma", () => {
    confirm.mockReturnValue(true);
    guard();

    const event = click(link("/pacientes"));

    expect(confirm).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("não pergunta em link que abre em outra aba, para baixar, externo ou com tecla modificadora", () => {
    guard();

    click(link("/pacientes/1/autorizacoes", { target: "_blank" }));
    click(link("/arquivo.pdf", { download: "" }));
    click(link("https://exemplo.test/"));
    click(link("/pacientes"), { ctrlKey: true });
    click(link(`${window.location.pathname}#topo`));

    expect(confirm).not.toHaveBeenCalled();
  });

  it("continua ativo enquanto houver alguma fonte de alterações", () => {
    const first = guard();
    const second = guard();

    first();
    expect(hasUnsavedChanges()).toBe(true);
    expect(beforeUnload().defaultPrevented).toBe(true);

    second();
    expect(hasUnsavedChanges()).toBe(false);
    expect(beforeUnload().defaultPrevented).toBe(false);
  });
});
