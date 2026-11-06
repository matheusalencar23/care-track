import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted: unknown[] = [];

  constructor(public name: string) {
    FakeBroadcastChannel.instances.push(this);
  }

  postMessage(data: unknown) {
    this.posted.push(data);
  }

  receive(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

const NOW = Date.parse("2026-11-06T12:00:00Z");
const minutes = (value: number) => value * 60 * 1000;
const iso = (time: number) => new Date(time).toISOString();
const httpDate = (time: number) => new Date(time).toUTCString();

async function loadSession() {
  vi.resetModules();
  return import("./session");
}

beforeEach(() => {
  FakeBroadcastChannel.instances = [];
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("recordSessionExpiry", () => {
  it("calcula a expiração pelo relógio do servidor, não pelo do cliente", async () => {
    const session = await loadSession();
    const serverNow = NOW + minutes(10);

    session.recordSessionExpiry(iso(serverNow + minutes(30)), httpDate(serverNow));

    expect(session.getSessionSnapshot()).toEqual({
      expiresAt: NOW + minutes(30),
      reachedMaxDuration: false,
      lastContactAt: NOW,
    });
  });

  it("usa o relógio local quando não há header Date", async () => {
    const session = await loadSession();

    session.recordSessionExpiry(iso(NOW + minutes(30)));

    expect(session.getSessionSnapshot()?.expiresAt).toBe(NOW + minutes(30));
  });

  it("marca o limite de 12 h quando a expiração ficou menor que 30 min", async () => {
    const session = await loadSession();

    session.recordSessionExpiry(iso(NOW + minutes(10)), httpDate(NOW));

    expect(session.getSessionSnapshot()?.reachedMaxDuration).toBe(true);
  });

  it("ignora um header inválido", async () => {
    const session = await loadSession();

    session.recordSessionExpiry("não é data");

    expect(session.getSessionSnapshot()).toBeNull();
  });

  it("avisa os inscritos e as outras abas", async () => {
    const session = await loadSession();
    const listener = vi.fn();
    session.subscribeSession(listener);

    session.recordSessionExpiry(iso(NOW + minutes(30)), httpDate(NOW));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(FakeBroadcastChannel.instances[0].posted).toEqual([
      { type: "session", state: session.getSessionSnapshot() },
    ]);
  });
});

describe("sincronização entre abas", () => {
  it("adota a sessão recebida de outra aba", async () => {
    const session = await loadSession();
    const listener = vi.fn();
    session.subscribeSession(listener);
    const state = {
      expiresAt: NOW + minutes(20),
      reachedMaxDuration: false,
      lastContactAt: NOW,
    };

    FakeBroadcastChannel.instances[0].receive({ type: "session", state });

    expect(session.getSessionSnapshot()).toEqual(state);
    expect(listener).toHaveBeenCalled();
  });

  it("repassa o logout feito em outra aba", async () => {
    const session = await loadSession();
    const listener = vi.fn();
    session.onLogoutFromAnotherTab(listener);

    FakeBroadcastChannel.instances[0].receive({ type: "logout" });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("envia o logout para as outras abas", async () => {
    const session = await loadSession();
    session.subscribeSession(() => {});

    session.broadcastLogout();

    expect(FakeBroadcastChannel.instances[0].posted).toEqual([{ type: "logout" }]);
  });

  it("funciona sem BroadcastChannel", async () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const session = await loadSession();

    session.recordSessionExpiry(iso(NOW + minutes(30)));
    session.broadcastLogout();

    expect(session.getSessionSnapshot()?.expiresAt).toBe(NOW + minutes(30));
  });
});

describe("isRenewalDue", () => {
  it("só renova depois do intervalo mínimo desde o último contato", async () => {
    const session = await loadSession();
    session.recordSessionExpiry(iso(NOW + minutes(30)), httpDate(NOW));

    expect(session.isRenewalDue(NOW + minutes(4))).toBe(false);
    expect(session.isRenewalDue(NOW + minutes(5))).toBe(true);
  });

  it("não renova sem sessão nem depois do limite de 12 h", async () => {
    const session = await loadSession();

    expect(session.isRenewalDue(NOW + minutes(10))).toBe(false);

    session.recordSessionExpiry(iso(NOW + minutes(10)), httpDate(NOW));

    expect(session.isRenewalDue(NOW + minutes(6))).toBe(false);
  });

  it("deixa de renovar depois de clearSession", async () => {
    const session = await loadSession();
    session.recordSessionExpiry(iso(NOW + minutes(30)), httpDate(NOW));

    session.clearSession();

    expect(session.getSessionSnapshot()).toBeNull();
    expect(session.isRenewalDue(NOW + minutes(10))).toBe(false);
  });
});

describe("renewSession", () => {
  it("faz uma única requisição enquanto a renovação está em andamento", async () => {
    const session = await loadSession();
    let resolve!: () => void;
    const request = vi.fn(() => new Promise<void>((done) => (resolve = done)));

    const first = session.renewSession(request);
    const second = session.renewSession(request);
    resolve();
    await Promise.all([first, second]);

    expect(request).toHaveBeenCalledTimes(1);

    const third = session.renewSession(request);
    resolve();
    await third;

    expect(request).toHaveBeenCalledTimes(2);
  });

  it("waitForPendingRenewal espera a renovação, mesmo se ela falhar", async () => {
    const session = await loadSession();
    let reject!: (error: Error) => void;
    const renewal = session.renewSession(
      () => new Promise((_, fail) => (reject = fail)),
    );
    renewal.catch(() => {});
    const waited = vi.fn();

    const waiting = session.waitForPendingRenewal().then(waited);
    await Promise.resolve();
    expect(waited).not.toHaveBeenCalled();

    reject(new Error("falhou"));
    await waiting;

    expect(waited).toHaveBeenCalled();
  });

  it("waitForPendingRenewal resolve na hora sem renovação pendente", async () => {
    const session = await loadSession();

    await expect(session.waitForPendingRenewal()).resolves.toBeUndefined();
  });
});
