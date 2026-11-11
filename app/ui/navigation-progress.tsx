"use client";

import {
  finishNavigation,
  getNavigation,
  subscribeNavigation,
  watchNavigationStarts,
} from "@/lib/navigation-progress";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export const NAVIGATION_PROGRESS_DELAY_MS = 150;
export const NAVIGATION_PROGRESS_TIMEOUT_MS = 15_000;

export default function NavigationProgress() {
  const navigation = useSyncExternalStore(
    subscribeNavigation,
    getNavigation,
    () => null,
  );
  const [shownNavigation, setShownNavigation] = useState<number | null>(null);
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const renderedUrl = useRef("");

  useEffect(() => {
    renderedUrl.current = search ? `${pathname}?${search}` : pathname;
    finishNavigation();
  }, [pathname, search]);

  useEffect(() => watchNavigationStarts(() => renderedUrl.current), []);

  useEffect(() => {
    if (navigation === null) {
      return;
    }

    const show = setTimeout(
      () => setShownNavigation(navigation),
      NAVIGATION_PROGRESS_DELAY_MS,
    );
    const giveUp = setTimeout(finishNavigation, NAVIGATION_PROGRESS_TIMEOUT_MS);

    return () => {
      clearTimeout(show);
      clearTimeout(giveUp);
    };
  }, [navigation]);

  if (navigation === null || shownNavigation !== navigation) {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-label="Carregando a página"
      className="fixed inset-x-0 top-0 z-60 h-1 overflow-hidden bg-teal-300/20"
    >
      <div className="h-full w-1/3 animate-navigation-progress bg-teal-300 motion-reduce:w-full motion-reduce:animate-none" />
    </div>
  );
}
