"use client";

import { useActionState } from "react";
import { unstable_rethrow } from "next/navigation";

type State = { error: string | null };

// Envuelve una server action para que, si lanza un Error (ej. validaciones de
// negocio como "no se puede cerrar con tareas pendientes"), se muestre como
// un mensaje prolijo en vez de la pantalla de error de Next.js. Los redirect()
// / notFound() internos se re-lanzan tal cual para que sigan funcionando.
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      try {
        await action(formData);
        return { error: null };
      } catch (error) {
        unstable_rethrow(error);
        return {
          error: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        };
      }
    },
    { error: null }
  );

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {isPending && <p className="text-xs text-gris-400">Guardando...</p>}
    </form>
  );
}
