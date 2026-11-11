import { internalLinkDestination, samePage } from "./internal-link";

type Listener = () => void;

let currentNavigation: number | null = null;
let sequence = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function startNavigation() {
  sequence += 1;
  currentNavigation = sequence;
  emit();
}

export function finishNavigation() {
  if (currentNavigation !== null) {
    currentNavigation = null;
    emit();
  }
}

export function startNavigationTo(href: string) {
  if (!samePage(new URL(href, window.location.href))) {
    startNavigation();
  }
}

export function getNavigation() {
  return currentNavigation;
}

export function subscribeNavigation(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function watchNavigationStarts(renderedUrl: () => string) {
  function onClick(event: MouseEvent) {
    if (internalLinkDestination(event)) {
      startNavigation();
    }
  }

  function onPopState() {
    if (window.location.pathname + window.location.search !== renderedUrl()) {
      startNavigation();
    }
  }

  document.addEventListener("click", onClick);
  window.addEventListener("popstate", onPopState);

  return () => {
    document.removeEventListener("click", onClick);
    window.removeEventListener("popstate", onPopState);
  };
}
