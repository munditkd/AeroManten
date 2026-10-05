"use client";

import { useState, useTransition } from "react";
import type { EstadoAccion } from "@/lib/accion-segura";

// Botón que pide confirmación con window.confirm antes de ejecutar una server
// action sin formulario visible (ej. "Eliminar" en una fila de grilla). El
// action tiene que devolver el error como valor, nunca lanzarlo (ver
// lib/accion-segura.ts) — es lo único confiable en producción.
export function ConfirmDeleteButton({
  action,
  mensaje,
  className,
  children,
}: {
  action: () => Promise<EstadoAccion>;
  mensaje: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (!window.confirm(mensaje)) return;
          setError(null);
          startTransition(async () => {
            const resultado = await action();
            if (resultado.error) setError(resultado.error);
          });
        }}
      >
        {children}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
