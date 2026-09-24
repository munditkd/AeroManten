import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  PRIORIDADES_OT,
  PRIORIDAD_OT_LABEL,
  PRIORIDAD_OT_BADGE_CLASS,
} from "@/lib/ordenes-trabajo";
import { obtenerEstados, claseBadgeEstado } from "@/lib/estados";
import { createOrdenTrabajo } from "./actions";

export default async function OrdenesTrabajoPage() {
  const [ordenes, aeronaves, personal, mantenimientosPreventivos, estados] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      orderBy: { fecha: "desc" },
      include: { aeronave: true, estado: true },
    }),
    prisma.aeronave.findMany({ orderBy: { matricula: "asc" } }),
    prisma.personal.findMany({ orderBy: [{ apellido: "asc" }, { nombre: "asc" }] }),
    prisma.mantenimientoPreventivo.findMany({ orderBy: { codigo: "asc" } }),
    obtenerEstados("OrdenTrabajo"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Órdenes de Trabajo</h1>
      <p className="mt-1 text-sm text-gris-500">
        Trabajos generados manualmente o a partir del Mantenimiento Preventivo.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Aeronave</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Prioridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gris-100">
              {ordenes.map((ot) => (
                <tr key={ot.id} className="hover:bg-gris-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/ordenes-trabajo/${ot.id}`}
                      className="font-medium text-celeste-700 hover:underline"
                    >
                      {ot.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gris-600">{ot.descripcion}</td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {ot.aeronave?.matricula ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {ot.fecha.toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${claseBadgeEstado(ot.estado.rstatus)}`}
                    >
                      {ot.estado.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDAD_OT_BADGE_CLASS[ot.prioridad]}`}
                    >
                      {PRIORIDAD_OT_LABEL[ot.prioridad]}
                    </span>
                  </td>
                </tr>
              ))}
              {ordenes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gris-500">
                    Todavía no hay órdenes de trabajo cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nueva orden de trabajo</h2>
            <p className="mt-1 text-xs text-gris-400">
              El código se asigna solo (OT-00001, OT-00002...) al guardar.
            </p>
            <form action={createOrdenTrabajo} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Fecha *</label>
                <input
                  name="fecha"
                  type="date"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Descripción *</label>
                <textarea
                  name="descripcion"
                  required
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Tipo</label>
                  <input
                    name="tipo"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Clase</label>
                  <input
                    name="clase"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Categoría</label>
                  <input
                    name="categoria"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Estado</label>
                  <select
                    name="estadoId"
                    defaultValue={estados.find((e) => e.status === "Pendiente")?.id ?? ""}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    {estados.map((estado) => (
                      <option key={estado.id} value={estado.id}>
                        {estado.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Prioridad</label>
                  <select
                    name="prioridad"
                    defaultValue="MEDIA"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    {PRIORIDADES_OT.map((prioridad) => (
                      <option key={prioridad} value={prioridad}>
                        {PRIORIDAD_OT_LABEL[prioridad]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">Departamento</label>
                <input
                  name="departamento"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <div className="border-t border-gris-100 pt-3">
                <label className="block text-xs font-medium text-gris-700">Aeronave</label>
                <select
                  name="aeronaveId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin aeronave</option>
                  {aeronaves.map((aeronave) => (
                    <option key={aeronave.id} value={aeronave.id}>
                      {aeronave.matricula}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gris-400">
                  El activo específico se elige después de crear la OT, desde el detalle.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Plan de inspección / tarea (MP)
                </label>
                <select
                  name="mantenimientoPreventivoId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin plan asociado</option>
                  {mantenimientosPreventivos.map((mp) => (
                    <option key={mp.id} value={mp.id}>
                      {mp.codigo} — {mp.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">Responsable</label>
                <select
                  name="responsableId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {personal.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.apellido}, {persona.nombre}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gris-400">
                  El originador se completa solo con tu usuario al crear la OT.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-gris-100 pt-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Fecha inicio</label>
                  <input
                    name="fechaInicio"
                    type="date"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Fecha fin planificado
                  </label>
                  <input
                    name="fechaFinPlanificado"
                    type="date"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Duración estimada (hs)
                  </label>
                  <input
                    name="duracionEstimada"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Duración real (hs)
                  </label>
                  <input
                    name="duracionReal"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">Falla</label>
                <textarea
                  name="falla"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Costo</label>
                  <input
                    name="costo"
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Hs totales</label>
                  <input
                    name="hsTotales"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">Comentarios</label>
                <textarea
                  name="comentarios"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear orden de trabajo
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
