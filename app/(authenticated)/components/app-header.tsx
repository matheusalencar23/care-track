"use client";

import { useLogout } from "@/hooks/auth/useLogout";
import { confirmLeave } from "@/lib/unsaved-changes";
import type { User } from "@/model/user";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  FaChevronDown,
  FaSignOutAlt,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import logo from "../../../public/logo.png";

interface Props {
  user: User;
}

const navItems = [{ href: "/pacientes", label: "Pacientes", icon: FaUsers }];

export default function AppHeader({ user }: Props) {
  const pathname = usePathname();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { signout, isPending: isLoggingOut } = useLogout();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (menuRef.current?.contains(document.activeElement)) {
        menuButtonRef.current?.focus();
      }

      setMenuIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = user.name
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-20 flex w-full items-center justify-between gap-3 border border-white/10 bg-white/10 px-3 py-2 shadow-2xl backdrop-blur-2xl sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <Link
          href="/pacientes"
          className="flex min-w-0 items-center gap-1 sm:gap-1.5"
        >
          <Image
            src={logo}
            alt=""
            className="w-10 sm:w-12 md:w-15"
            preload
          />

          <span className="hidden truncate text-lg font-semibold text-white sm:inline sm:text-xl md:text-2xl">
            Care<span className="text-teal-300">Track</span>
          </span>
          <span className="sr-only sm:hidden">CareTrack</span>
        </Link>

        <nav aria-label="Navegação principal">
          <ul className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                      active
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon aria-hidden className="text-xs" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div ref={menuRef} className="relative shrink-0">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuIsOpen((prev) => !prev)}
          className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 sm:gap-3 sm:px-3"
          aria-expanded={menuIsOpen}
          aria-controls={menuIsOpen ? menuId : undefined}
        >
          <span className="sr-only">Menu do usuário: </span>
          <div
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
          >
            {initials}
          </div>

          <span className="sr-only sm:not-sr-only sm:max-w-32 sm:truncate">
            {user.name}
          </span>

          <FaChevronDown
            aria-hidden
            className={`hidden text-xs transition-transform duration-200 sm:block ${
              menuIsOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {menuIsOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-xl border border-white/10 bg-white shadow-xl ring-1 ring-black/5"
            id={menuId}
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.name}
              </p>

              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>

            <div className="p-1">
              <Link
                href="/perfil"
                onClick={() => setMenuIsOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <FaUserCircle aria-hidden className="text-xs" />
                Meu perfil
              </Link>

              <button
                type="button"
                onClick={() => confirmLeave() && signout()}
                disabled={isLoggingOut}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaSignOutAlt aria-hidden className="text-xs" />
                {isLoggingOut ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
