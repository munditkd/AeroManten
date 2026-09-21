"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function UserMenu({
  name,
  email,
  children,
}: {
  name?: string | null;
  email?: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inicial = (name || email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-celeste-700 text-sm font-semibold text-white hover:bg-celeste-800"
        aria-label="Menú de usuario"
      >
        {inicial}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gris-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gris-100 px-4 py-2">
            <p className="truncate text-sm font-medium text-gris-900">
              {name || "Usuario"}
            </p>
            {email && <p className="truncate text-xs text-gris-500">{email}</p>}
          </div>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gris-700 hover:bg-gris-50 hover:text-celeste-700"
          >
            Mi perfil
          </Link>
          <div className="px-2 py-1">{children}</div>
        </div>
      )}
    </div>
  );
}
