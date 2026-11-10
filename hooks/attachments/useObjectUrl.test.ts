import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useObjectUrl } from "./useObjectUrl";

const createObjectURL = vi.fn<(blob: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

beforeEach(() => {
  vi.useFakeTimers();
  createObjectURL.mockReset().mockReturnValue("blob:arquivo");
  revokeObjectURL.mockReset();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useObjectUrl", () => {
  it("cria a URL com o tipo pedido e a revoga depois de desmontar", () => {
    const file = new File(["<html>"], "falso.pdf", { type: "text/html" });
    const { result, unmount } = renderHook(() => useObjectUrl(file, "application/pdf"));

    expect(result.current).toBe("blob:arquivo");
    expect(createObjectURL.mock.calls[0]?.[0]).toHaveProperty("type", "application/pdf");

    unmount();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:arquivo");
  });
});
