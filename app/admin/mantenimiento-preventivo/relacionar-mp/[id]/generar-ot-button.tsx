"use client";

import { useState, useTransition } from "react";

export function GenerarOTButton({
  vencido,
  action,
}: {
  vencido: boolean;
  action: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const mensaje = vencido
      ? "Este MP está VENCIDO. ¿Confirmás generar una Orden de Trabajo?"
      : "Este MP todavía NO está vencido. ¿Confirmás generar una Orden de Trabajo igual?";
    if (!window.confirm(mensaje)) return;

    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo generar la OT");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`w-full rounded-md py-2 text-sm font-semibold text-white disabled:opacity-50 ${
          vencido ? "bg-red-600 hover:bg-red-700" : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {pending ? "Generando OT..." : "Generar OT"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
