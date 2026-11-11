import { internalLinkDestination } from "./internal-link";

export const UNSAVED_CHANGES_MESSAGE =
  "Há alterações não salvas nesta página. Se sair, o que foi digitado e os arquivos anexados serão perdidos. Deseja sair mesmo assim?";

interface NavigateEvent extends Event {
  navigationType: string;
  destination: { sameDocument: boolean };
}

const sources = new Set<symbol>();
let uninstall: (() => void) | null = null;

function navigationApi() {
  return (window as { navigation?: EventTarget }).navigation;
}

export function hasUnsavedChanges() {
  return sources.size > 0;
}

export function confirmLeave() {
  return !hasUnsavedChanges() || window.confirm(UNSAVED_CHANGES_MESSAGE);
}

function install() {
  const navigation = navigationApi();

  function onBeforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = "";
  }

  function onClick(event: MouseEvent) {
    if (
      !event.defaultPrevented &&
      internalLinkDestination(event) &&
      !confirmLeave()
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function onNavigate(event: Event) {
    const { navigationType, destination, cancelable } = event as NavigateEvent;

    if (
      navigationType === "traverse" &&
      destination.sameDocument &&
      cancelable &&
      !confirmLeave()
    ) {
      event.preventDefault();
    }
  }

  window.addEventListener("beforeunload", onBeforeUnload);
  document.addEventListener("click", onClick, true);
  navigation?.addEventListener("navigate", onNavigate);

  return () => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    document.removeEventListener("click", onClick, true);
    navigation?.removeEventListener("navigate", onNavigate);
  };
}

export function guardUnsavedChanges() {
  const source = Symbol("unsaved-changes");
  sources.add(source);
  uninstall ??= install();

  return () => {
    sources.delete(source);

    if (sources.size === 0) {
      uninstall?.();
      uninstall = null;
    }
  };
}
