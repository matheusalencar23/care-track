export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const RENEWAL_INTERVAL_MS = 5 * 60 * 1000;
export const IDLE_WARNING_MS = 2 * 60 * 1000;
export const MAX_DURATION_WARNING_MS = 5 * 60 * 1000;

export interface SessionState {
  expiresAt: number;
  reachedMaxDuration: boolean;
  lastContactAt: number;
}

type SessionMessage =
  | { type: "session"; state: SessionState }
  | { type: "logout" };

let state: SessionState | null = null;
let renewal: Promise<void> | null = null;
let channel: BroadcastChannel | null | undefined;

const stateListeners = new Set<() => void>();
const logoutListeners = new Set<() => void>();

function setState(next: SessionState | null) {
  state = next;
  stateListeners.forEach((listener) => listener());
}

function getChannel() {
  if (channel !== undefined) {
    return channel;
  }

  if (typeof BroadcastChannel === "undefined") {
    channel = null;
    return channel;
  }

  channel = new BroadcastChannel("caretrack-session");
  channel.onmessage = (event: MessageEvent<SessionMessage>) => {
    if (event.data.type === "session") {
      setState(event.data.state);
    } else {
      logoutListeners.forEach((listener) => listener());
    }
  };

  return channel;
}

export function recordSessionExpiry(expiresAtHeader: string, dateHeader?: string) {
  const expiresAt = Date.parse(expiresAtHeader);

  if (Number.isNaN(expiresAt)) {
    return;
  }

  const now = Date.now();
  const serverNow = dateHeader ? Date.parse(dateHeader) : Number.NaN;
  const remaining = expiresAt - (Number.isNaN(serverNow) ? now : serverNow);

  const next: SessionState = {
    expiresAt: now + remaining,
    reachedMaxDuration: remaining < SESSION_IDLE_TIMEOUT_MS - 60 * 1000,
    lastContactAt: now,
  };

  setState(next);
  getChannel()?.postMessage({ type: "session", state: next });
}

export function clearSession() {
  setState(null);
}

export function broadcastLogout() {
  getChannel()?.postMessage({ type: "logout" });
}

export function subscribeSession(listener: () => void) {
  getChannel();
  stateListeners.add(listener);

  return () => {
    stateListeners.delete(listener);
  };
}

export function getSessionSnapshot() {
  return state;
}

export function onLogoutFromAnotherTab(listener: () => void) {
  getChannel();
  logoutListeners.add(listener);

  return () => {
    logoutListeners.delete(listener);
  };
}

export function isRenewalDue(now: number) {
  return (
    state !== null &&
    !state.reachedMaxDuration &&
    now - state.lastContactAt >= RENEWAL_INTERVAL_MS
  );
}

export function renewSession(request: () => Promise<unknown>) {
  if (!renewal) {
    renewal = request()
      .then(() => undefined)
      .finally(() => {
        renewal = null;
      });
  }

  return renewal;
}

export async function waitForPendingRenewal() {
  await renewal?.catch(() => undefined);
}
