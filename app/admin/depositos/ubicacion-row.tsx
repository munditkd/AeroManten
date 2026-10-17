"use client";

import { useState, useTransition } from "react";
import type { EstadoAccion } from "@/lib/accion-segura";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";

// <details> propio (no ActionForm) porque necesitamos cerrarlo solo cuando
// el guardado de la descripción sale bien, en vez de quedar abierto.
export function UbicacionRow({
  ubicacion,
  updateAction,
  deleteAction,
}: {
  ubicacion: { id: string; codigo: string; descripcion: string | null };
  updateAction: (prevState: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  deleteAction: () => Promise<EstadoAccion>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const resultado = await updateAction({ error: null }, formData);
      if (resultado.error) {
        setError(resultado.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="py-2"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm">
        <span>
          <span className="font-mono text-gris-700">{ubicacion.codigo}</span>
          {ubicacion.descripcion && (
            <span className="ml-2 text-gris-500">— {ubicacion.descripcion}</span>
          )}
        </span>
      </summary>
      <div className="mt-2 space-y-2 pl-1">
        <form action={handleSubmit} className="flex gap-2">
          <input
            name="descripcion"
            defaultValue={ubicacion.descripcion ?? ""}
            placeholder="Descripción (ej: aceites y lubricantes)"
            className="flex-1 rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-gris-300 px-3 py-1.5 text-sm font-medium text-gris-700 hover:bg-gris-50 disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </form>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <ConfirmDeleteButton
          action={deleteAction}
          mensaje={`¿Eliminar la ubicación "${ubicacion.codigo}"?`}
          className="text-xs font-medium text-red-500 hover:underline"
        >
          Eliminar ubicación
        </ConfirmDeleteButton>
      </div>
    </details>
  );
}
