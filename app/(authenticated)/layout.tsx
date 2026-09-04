"use client";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaSignOutAlt } from "react-icons/fa";
import logo from "../../public/logo.png";
import Image from "next/image";
import { useLogout } from "@/hooks/auth/useLogout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: user, isLoading } = useCurrentUser();
  const [dropdownIsOpen, setDropdownIsOpen] = useState(false);
  const { signout } = useLogout();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = user?.name
    ?.split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function logout() {
    await signout();
  }

  return (
    <>
      <header className="relative flex w-full items-center justify-between border border-white/10 bg-white/10 px-6 py-2 shadow-2xl backdrop-blur-2xl z-2">
        <Image src={logo} alt="Logo" className="w-15" loading="eager" />

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownIsOpen((prev) => !prev)}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-haspopup="menu"
            aria-expanded={dropdownIsOpen}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {isLoading ? "..." : initials}
            </div>

            <span className="max-w-32 truncate">
              {isLoading ? "Carregando..." : user?.name}
            </span>

            <FaChevronDown
              className={`text-xs transition-transform duration-200 ${
                dropdownIsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownIsOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
              role="menu"
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {user?.name}
                </p>

                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>

              <div className="p-1">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  role="menuitem"
                >
                  <FaSignOutAlt className="text-xs" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {children}
    </>
  );
}
