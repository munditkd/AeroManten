"use client";

import { useState, useTransition } from "react";

// Botón que pide confirmación con window.confirm antes de ejecutar una server
// action sin formulario visible (ej. "Eliminar" en una fila de grilla).
export function ConfirmDeleteButton({
  action,
  mensaje,
  className,
  children,
}: {
  action: () => Promise<void>;
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
            try {
              await action();
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo completar la acción");
            }
          });
        }}
      >
        {children}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
