"use client";

import { useState, useTransition } from "react";
import type { EstadoAccion } from "@/lib/accion-segura";

type ItemResuelto = {
  id: string;
  cantidad: number;
  piezaId: string | null;
  servicioId: string | null;
  nombre: string;
  unidad: string;
};

type OpcionCatalogo = { id: string; nombre: string; unidadMedida: string };
type RequerimientoAbierto = { id: string; codigo: string; titulo: string };

// Agrega/quita ítems sigue abierto a cualquier usuario con permiso (ver
// createItem más abajo, fuera de este componente). Acá adentro vive lo
// exclusivo de ADMIN/ADMINISTRATIVO: editar pieza/servicio y cantidad de un
// ítem ya cargado, y mover líneas a otro Requerimiento abierto del mismo
// tipo (para no duplicar pedidos de lo mismo — ver moverItems).
export function ItemsList({
  tipoLabel,
  items,
  puedeAprobar,
  opcionesCatalogo,
  requerimientosAbiertos,
  deleteItemAction,
  updateItemAction,
  moverItemsAction,
}: {
  tipoLabel: "pieza" | "servicio";
  items: ItemResuelto[];
  puedeAprobar: boolean;
  opcionesCatalogo: OpcionCatalogo[];
  requerimientosAbiertos: RequerimientoAbierto[];
  deleteItemAction: (itemId: string) => Promise<EstadoAccion>;
  updateItemAction: (
    itemId: string,
    prevState: EstadoAccion,
    formData: FormData
  ) => Promise<EstadoAccion>;
  moverItemsAction: (prevState: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [modoMover, setModoMover] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [modalAbierto, setModalAbierto] = useState(false);
  const [destinoId, setDestinoId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const catalogoLabel = tipoLabel === "pieza" ? "Pieza" : "Servicio";

  function toggleSeleccionado(itemId: string, marcado: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (marcado) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  function salirDeModoMover() {
    setModoMover(false);
    setSeleccionados(new Set());
    setModalAbierto(false);
    setDestinoId("");
  }

  function guardarEdicion(itemId: string, formEl: HTMLFormElement) {
    setError(null);
    const formData = new FormData(formEl);
    startTransition(async () => {
      const resultado = await updateItemAction(itemId, { error: null }, formData);
      if (resultado.error) setError(resultado.error);
      else setEditandoId(null);
    });
  }

  function confirmarMover() {
    if (!destinoId) {
      setError("Elegí a qué requerimiento mover");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("destinoId", destinoId);
    seleccionados.forEach((id) => formData.append("itemIds", id));
    startTransition(async () => {
      const resultado = await moverItemsAction({ error: null }, formData);
      if (resultado.error) setError(resultado.error);
      else salirDeModoMover();
    });
  }

  return (
    <div>
      {puedeAprobar && items.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (modoMover ? salirDeModoMover() : setModoMover(true))}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              modoMover
                ? "border-gris-300 text-gris-700 hover:bg-gris-50"
                : "border-celeste-700 text-celeste-700 hover:bg-celeste-50"
            }`}
          >
            {modoMover ? "Cancelar" : "Mover líneas"}
          </button>
          {modoMover && seleccionados.size > 0 && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="rounded-md bg-celeste-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-celeste-800"
            >
              Mover {seleccionados.size} ítem{seleccionados.size > 1 ? "s" : ""}…
            </button>
          )}
        </div>
      )}

      <ul className="divide-y divide-gris-100">
        {items.map((item) => {
          const editando = editandoId === item.id;
          return (
            <li key={item.id} className="py-3">
              {editando ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    guardarEdicion(item.id, e.currentTarget);
                  }}
                  className="flex flex-wrap items-end gap-2"
                >
                  <div className="flex-1 basis-full sm:basis-auto">
                    <label className="block text-xs font-medium text-gris-700">
                      {catalogoLabel}
                    </label>
                    <select
                      name={tipoLabel === "pieza" ? "piezaId" : "servicioId"}
                      defaultValue={item.piezaId ?? item.servicioId ?? ""}
                      required
                      className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                    >
                      {opcionesCatalogo.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gris-700">Cant.</label>
                    <input
                      name="cantidad"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={item.cantidad}
                      required
                      className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-md border border-celeste-700 px-3 py-1.5 text-xs font-medium text-celeste-700 hover:bg-celeste-50"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    className="rounded-md border border-gris-300 px-3 py-1.5 text-xs font-medium text-gris-600 hover:bg-gris-50"
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {modoMover && (
                      <input
                        type="checkbox"
                        checked={seleccionados.has(item.id)}
                        onChange={(e) => toggleSeleccionado(item.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                    )}
                    <div>
                      <p className="text-sm text-gris-900">{item.nombre}</p>
                      <p className="text-xs text-gris-500">
                        {item.cantidad} {item.unidad}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {puedeAprobar && !modoMover && (
                      <button
                        type="button"
                        onClick={() => setEditandoId(item.id)}
                        className="text-xs font-medium text-celeste-700 hover:underline"
                      >
                        Editar
                      </button>
                    )}
                    {!modoMover && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`¿Quitar "${item.nombre}" del requerimiento?`)) return;
                          setError(null);
                          startTransition(async () => {
                            const resultado = await deleteItemAction(item.id);
                            if (resultado.error) setError(resultado.error);
                          });
                        }}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="py-3 text-sm text-gris-500">Todavía no hay ítems cargados.</li>
        )}
      </ul>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-gris-900">Mover a otro requerimiento</h3>
            <p className="mt-1 text-xs text-gris-500">
              {seleccionados.size} ítem{seleccionados.size > 1 ? "s" : ""} seleccionado
              {seleccionados.size > 1 ? "s" : ""}. Si el destino ya tiene esa misma{" "}
              {tipoLabel}, se suman las cantidades.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gris-700">
                Requerimiento destino
              </label>
              <select
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
              >
                <option value="" disabled>
                  Elegí un requerimiento
                </option>
                {requerimientosAbiertos.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.codigo} — {req.titulo}
                  </option>
                ))}
              </select>
              {requerimientosAbiertos.length === 0 && (
                <p className="mt-1 text-xs text-gris-400">
                  No hay otros requerimientos abiertos del mismo tipo para mover.
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={pending || !destinoId}
                onClick={confirmarMover}
                className="flex-1 rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800 disabled:opacity-50"
              >
                {pending ? "Moviendo..." : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="flex-1 rounded-md border border-gris-300 py-2 text-sm font-medium text-gris-700 hover:bg-gris-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
