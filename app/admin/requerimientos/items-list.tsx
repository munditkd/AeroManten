"use client";

import { useRef, useState, useTransition } from "react";
import type { EstadoAccion } from "@/lib/accion-segura";

type ItemResuelto = {
  id: string;
  cantidad: number;
  piezaId: string | null;
  servicioId: string | null;
  nombre: string;
  codigo: number;
  claseCategoria: string | null;
  unidad: string;
};

type OpcionCatalogo = { id: string; nombre: string; unidadMedida: string };
type RequerimientoAbierto = { id: string; codigo: string; titulo: string };

function TachoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13M10 11v6m4-6v6"
      />
    </svg>
  );
}

// Fila editable: cada celda guarda sola al cambiar (onChange/onBlur), sin
// botones de Guardar/Cancelar por fila — ver pedido del usuario. Usa refs en
// vez de estado controlado para no pelear con los defaultValue al refrescar
// la lista desde el servidor después de cada guardado.
function FilaEditable({
  item,
  numero,
  tipoLabel,
  opcionesCatalogo,
  onGuardar,
  onBorrar,
  pending,
}: {
  item: ItemResuelto;
  numero: number;
  tipoLabel: "pieza" | "servicio";
  opcionesCatalogo: OpcionCatalogo[];
  onGuardar: (itemId: string, formData: FormData) => void;
  onBorrar: (item: ItemResuelto) => void;
  pending: boolean;
}) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);

  function guardar() {
    const formData = new FormData();
    formData.set(
      tipoLabel === "pieza" ? "piezaId" : "servicioId",
      selectRef.current?.value ?? ""
    );
    formData.set("cantidad", cantidadRef.current?.value ?? "");
    onGuardar(item.id, formData);
  }

  return (
    <tr>
      <td className="px-3 py-2 text-gris-500">{numero}</td>
      <td className="px-3 py-2 text-gris-500">{item.codigo}</td>
      <td className="px-3 py-2">
        <select
          ref={selectRef}
          defaultValue={item.piezaId ?? item.servicioId ?? ""}
          onChange={guardar}
          disabled={pending}
          className="w-full rounded-md border border-gris-300 px-2 py-1 text-sm focus:border-celeste-600 focus:outline-none"
        >
          {opcionesCatalogo.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nombre}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 text-gris-500">{item.claseCategoria ?? "—"}</td>
      <td className="px-3 py-2">
        <input
          ref={cantidadRef}
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={item.cantidad}
          onBlur={guardar}
          disabled={pending}
          className="w-24 rounded-md border border-gris-300 px-2 py-1 text-sm focus:border-celeste-600 focus:outline-none"
        />
      </td>
      <td className="px-3 py-2 text-gris-500">{item.unidad}</td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          disabled={pending}
          onClick={() => onBorrar(item)}
          title="Quitar línea"
          className="text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          <TachoIcon />
        </button>
      </td>
    </tr>
  );
}

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
  const [modo, setModo] = useState<"ver" | "editar" | "mover">("ver");
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

  function volverAVer() {
    setModo("ver");
    setSeleccionados(new Set());
    setModalAbierto(false);
    setDestinoId("");
    setError(null);
  }

  function guardarCelda(itemId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const resultado = await updateItemAction(itemId, { error: null }, formData);
      if (resultado.error) setError(resultado.error);
    });
  }

  function borrarItem(item: ItemResuelto) {
    if (!window.confirm(`¿Quitar "${item.nombre}" del requerimiento?`)) return;
    setError(null);
    startTransition(async () => {
      const resultado = await deleteItemAction(item.id);
      if (resultado.error) setError(resultado.error);
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
      else volverAVer();
    });
  }

  return (
    <div>
      {puedeAprobar && items.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (modo === "editar" ? volverAVer() : setModo("editar"))}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                modo === "editar"
                  ? "border-gris-300 text-gris-700 hover:bg-gris-50"
                  : "border-celeste-700 text-celeste-700 hover:bg-celeste-50"
              }`}
            >
              {modo === "editar" ? "Listo" : "Editar"}
            </button>
            <button
              type="button"
              onClick={() => (modo === "mover" ? volverAVer() : setModo("mover"))}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                modo === "mover"
                  ? "border-gris-300 text-gris-700 hover:bg-gris-50"
                  : "border-celeste-700 text-celeste-700 hover:bg-celeste-50"
              }`}
            >
              {modo === "mover" ? "Cancelar" : "Mover líneas"}
            </button>
          </div>
          {modo === "mover" && seleccionados.size > 0 && (
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

      <div className="overflow-x-auto rounded-md border border-gris-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
            <tr>
              {modo === "mover" && <th className="px-3 py-2"></th>}
              <th className="px-3 py-2">Ítem</th>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">{catalogoLabel}</th>
              <th className="px-3 py-2">Clase / Categoría</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Unidad</th>
              {modo === "editar" && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gris-100">
            {items.map((item, idx) =>
              modo === "editar" ? (
                <FilaEditable
                  key={item.id}
                  item={item}
                  numero={idx + 1}
                  tipoLabel={tipoLabel}
                  opcionesCatalogo={opcionesCatalogo}
                  onGuardar={guardarCelda}
                  onBorrar={borrarItem}
                  pending={pending}
                />
              ) : (
                <tr key={item.id}>
                  {modo === "mover" && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(item.id)}
                        onChange={(e) => toggleSeleccionado(item.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2 text-gris-500">{idx + 1}</td>
                  <td className="px-3 py-2 text-gris-500">{item.codigo}</td>
                  <td className="px-3 py-2 text-gris-900">{item.nombre}</td>
                  <td className="px-3 py-2 text-gris-500">{item.claseCategoria ?? "—"}</td>
                  <td className="px-3 py-2 text-gris-900">{item.cantidad}</td>
                  <td className="px-3 py-2 text-gris-500">{item.unidad}</td>
                </tr>
              )
            )}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={modo === "mover" ? 7 : 6}
                  className="px-3 py-3 text-sm text-gris-500"
                >
                  Todavía no hay ítems cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
