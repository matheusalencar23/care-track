import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppRouter } from "@/hooks/useAppRouter";
import { finishNavigation } from "@/lib/navigation-progress";
import NavigationProgress, {
  NAVIGATION_PROGRESS_DELAY_MS,
  NAVIGATION_PROGRESS_TIMEOUT_MS,
} from "./navigation-progress";

const navigation = vi.hoisted(() => ({
  pathname: "/pacientes",
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
}));

function link(href: string, attributes: Record<string, string> = {}) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = "Ir";
  for (const [name, value] of Object.entries(attributes)) {
    anchor.setAttribute(name, value);
  }
  anchor.addEventListener("click", (event) => event.preventDefault());
  document.body.append(anchor);
  return anchor;
}

function click(anchor: HTMLElement) {
  act(() => {
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  });
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  navigation.pathname = "/pacientes";
  window.history.replaceState(null, "", "/pacientes");
});

afterEach(() => {
  act(() => finishNavigation());
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("NavigationProgress", () => {
  it("aparece quando a navegação demora e some quando a página nova chega", () => {
    const { rerender } = render(<NavigationProgress />);

    click(link("/perfil"));
    wait(NAVIGATION_PROGRESS_DELAY_MS - 1);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    wait(1);
    expect(screen.getByRole("progressbar", { name: "Carregando a página" })).toBeInTheDocument();

    navigation.pathname = "/perfil";
    rerender(<NavigationProgress />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("não pisca em navegação rápida", () => {
    const { rerender } = render(<NavigationProgress />);

    click(link("/perfil"));
    wait(50);
    navigation.pathname = "/perfil";
    rerender(<NavigationProgress />);
    wait(NAVIGATION_PROGRESS_DELAY_MS);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("não aparece em link para a mesma página, em nova aba ou para download", () => {
    render(<NavigationProgress />);

    click(link("/pacientes#topo"));
    click(link("/termos", { target: "_blank" }));
    click(link("/arquivo.pdf", { download: "" }));
    wait(NAVIGATION_PROGRESS_DELAY_MS);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("desiste depois de muito tempo sem a página nova", () => {
    render(<NavigationProgress />);

    click(link("/perfil"));
    wait(NAVIGATION_PROGRESS_DELAY_MS);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    wait(NAVIGATION_PROGRESS_TIMEOUT_MS);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("aparece nas navegações do useAppRouter, menos para a página atual", () => {
    render(<NavigationProgress />);
    const { result } = renderHook(() => useAppRouter());

    act(() => result.current.push("/pacientes"));
    wait(NAVIGATION_PROGRESS_DELAY_MS);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(navigation.push).toHaveBeenCalledWith("/pacientes");

    act(() => result.current.replace("/login?expired=true"));
    wait(NAVIGATION_PROGRESS_DELAY_MS);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith("/login?expired=true");
  });
});
