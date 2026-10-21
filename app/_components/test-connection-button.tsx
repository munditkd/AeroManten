"use client";

import { useState, useTransition } from "react";
import type { EstadoAccion } from "@/lib/accion-segura";

// Botón para probar una conexión (ej. SMTP) sin recargar la página. A
// diferencia de ConfirmDeleteButton, acá el resultado también se muestra en
// caso de éxito, no solo en caso de error.
export function TestConnectionButton({
  action,
  className,
  children,
}: {
  action: () => Promise<EstadoAccion>;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          setResultado(null);
          startTransition(async () => {
            const respuesta = await action();
            setResultado(
              respuesta.error
                ? { ok: false, mensaje: respuesta.error }
                : { ok: true, mensaje: "Conexión exitosa." }
            );
          });
        }}
      >
        {pending ? "Probando..." : children}
      </button>
      {resultado && (
        <p className={`mt-1 text-xs ${resultado.ok ? "text-green-600" : "text-red-600"}`}>
          {resultado.mensaje}
        </p>
      )}
    </div>
  );
}
