"use client";

import { useActionState } from "react";
import type { EstadoAccion } from "@/lib/accion-segura";

// El "action" que recibe este componente tiene que devolver el error como
// valor (ver lib/accion-segura.ts), nunca lanzarlo — es lo único que
// funciona de forma confiable en producción con useActionState.
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prevState: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState<EstadoAccion, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p className="whitespace-pre-line rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {isPending && <p className="text-xs text-gris-400">Guardando...</p>}
    </form>
  );
}
