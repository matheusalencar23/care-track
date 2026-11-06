"use client";

import Button from "@/app/ui/button";
import Modal from "@/app/ui/modal";
import { useLogout } from "@/hooks/auth/useLogout";
import { queryKeys } from "@/lib/query-keys";
import {
  getSessionSnapshot,
  IDLE_WARNING_MS,
  isRenewalDue,
  MAX_DURATION_WARNING_MS,
  onLogoutFromAnotherTab,
  renewSession,
  subscribeSession,
} from "@/lib/session";
import { getCurrentUser } from "@/services/auth.service";
import { ApiError } from "@/shared/ApiError";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const ACTIVITY_EVENTS = ["keydown", "pointerdown", "wheel", "touchmove"];

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SessionTimeout() {
  const queryClient = useQueryClient();
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null,
  );
  const [now, setNow] = useState(() => Date.now());
  const [maxDurationNoticeSeen, setMaxDurationNoticeSeen] = useState(false);
  const { signout, isPending: isLoggingOut } = useLogout();

  const renew = useCallback(
    () =>
      renewSession(async () => {
        const user = await getCurrentUser();
        queryClient.setQueryData(queryKeys.auth.me, user);
      }).catch((err: unknown) => {
        if (err instanceof ApiError && err.statusCode === 401) {
          queryClient.clear();
          window.location.replace("/login?expired=true");
        }
      }),
    [queryClient],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleActivity() {
      if (isRenewalDue(Date.now())) {
        void renew();
      }
    }

    ACTIVITY_EVENTS.forEach((type) =>
      window.addEventListener(type, handleActivity, { passive: true }),
    );

    return () => {
      ACTIVITY_EVENTS.forEach((type) =>
        window.removeEventListener(type, handleActivity),
      );
    };
  }, [renew]);

  useEffect(
    () =>
      onLogoutFromAnotherTab(() => {
        queryClient.clear();
        window.location.replace("/login");
      }),
    [queryClient],
  );

  const remaining = session ? session.expiresAt - now : null;
  const isExpired = remaining !== null && remaining <= 0;

  useEffect(() => {
    if (isExpired && !isLoggingOut) {
      queryClient.clear();
      window.location.replace("/login?expired=true");
    }
  }, [isExpired, isLoggingOut, queryClient]);

  if (!session || remaining === null || isExpired) {
    return null;
  }

  if (session.reachedMaxDuration) {
    return (
      <Modal
        open={remaining <= MAX_DURATION_WARNING_MS && !maxDurationNoticeSeen}
        onClose={() => setMaxDurationNoticeSeen(true)}
        title="Sua sessão vai terminar"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              block={false}
              onClick={() => signout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Saindo..." : "Sair agora"}
            </Button>
            <Button
              type="button"
              block={false}
              onClick={() => setMaxDurationNoticeSeen(true)}
              data-autofocus
            >
              Entendi
            </Button>
          </>
        }
      >
        <p>
          Sua sessão está chegando ao limite de 12 horas. Salve o que estiver
          fazendo: em{" "}
          <strong className="font-semibold text-white">
            {formatRemaining(remaining)}
          </strong>{" "}
          será preciso entrar de novo.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={remaining <= IDLE_WARNING_MS}
      onClose={() => void renew()}
      title="Você ainda está aí?"
      dismissible={false}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            block={false}
            onClick={() => signout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </Button>
          <Button
            type="button"
            block={false}
            onClick={() => void renew()}
            disabled={isLoggingOut}
            data-autofocus
          >
            Continuar conectado
          </Button>
        </>
      }
    >
      <p>
        Por segurança, sua sessão será encerrada por inatividade em{" "}
        <strong className="font-semibold text-white">
          {formatRemaining(remaining)}
        </strong>
        .
      </p>
    </Modal>
  );
}
