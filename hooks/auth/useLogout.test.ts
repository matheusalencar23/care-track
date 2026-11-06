import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { broadcastLogout, clearSession, renewSession } from "@/lib/session";
import { logout } from "@/services/auth.service";
import { renderHookWithQueryClient } from "@/test/render";
import { useLogout } from "./useLogout";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services/auth.service", () => ({
  logout: vi.fn(),
}));

vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  clearSession: vi.fn(),
  broadcastLogout: vi.fn(),
}));

beforeEach(() => {
  push.mockReset();
  vi.mocked(logout).mockReset().mockResolvedValue({});
});

describe("useLogout", () => {
  it("encerra a sessão, limpa o cache, avisa as outras abas e vai para o login", async () => {
    const { result, queryClient } = renderHookWithQueryClient(useLogout);
    queryClient.setQueryData(queryKeys.auth.me, { name: "Ana" });

    act(() => result.current.signout());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalled();
    expect(broadcastLogout).toHaveBeenCalled();
    expect(queryClient.getQueryData(queryKeys.auth.me)).toBeUndefined();
  });

  it("espera a renovação em andamento antes de chamar o signout", async () => {
    let finishRenewal!: () => void;
    void renewSession(() => new Promise<void>((done) => (finishRenewal = done)));
    const { result } = renderHookWithQueryClient(useLogout);

    act(() => result.current.signout());
    await act(() => Promise.resolve());

    expect(logout).not.toHaveBeenCalled();

    finishRenewal();

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it("mantém a sessão quando o signout falha", async () => {
    vi.mocked(logout).mockRejectedValue(new Error("falhou"));
    const { result, queryClient } = renderHookWithQueryClient(useLogout);
    queryClient.setQueryData(queryKeys.auth.me, { name: "Ana" });

    act(() => result.current.signout());

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(push).not.toHaveBeenCalled();
    expect(clearSession).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(queryKeys.auth.me)).toEqual({ name: "Ana" });
  });
});
