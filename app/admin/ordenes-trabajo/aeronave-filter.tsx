"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AeronaveFilter({
  aeronaves,
  selectedAeronaveId,
  active,
}: {
  aeronaves: { id: string; matricula: string }[];
  selectedAeronaveId?: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
          active
            ? "border-celeste-700 bg-celeste-700 text-white"
            : "border-gris-300 text-gris-700 hover:bg-gris-50"
        }`}
      >
        De Aeronave
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-56 rounded-md border border-gris-200 bg-white py-1 shadow-lg">
          <Link
            href="/admin/ordenes-trabajo?vista=aeronave"
            onClick={() => setOpen(false)}
            className={`block px-4 py-2 text-sm hover:bg-gris-50 hover:text-celeste-700 ${
              active && !selectedAeronaveId ? "font-medium text-celeste-700" : "text-gris-700"
            }`}
          >
            Todas las matrículas
          </Link>
          {aeronaves.map((aeronave) => (
            <Link
              key={aeronave.id}
              href={`/admin/ordenes-trabajo?vista=aeronave&aeronaveId=${aeronave.id}`}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm hover:bg-gris-50 hover:text-celeste-700 ${
                selectedAeronaveId === aeronave.id
                  ? "font-medium text-celeste-700"
                  : "text-gris-700"
              }`}
            >
              {aeronave.matricula}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
