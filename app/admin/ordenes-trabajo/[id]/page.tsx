import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ESTADOS_OT,
  ESTADO_OT_LABEL,
  ESTADO_OT_BADGE_CLASS,
  PRIORIDADES_OT,
  PRIORIDAD_OT_LABEL,
  PRIORIDAD_OT_BADGE_CLASS,
} from "@/lib/ordenes-trabajo";
import {
  updateOrdenTrabajo,
  deleteOrdenTrabajo,
  createManoDeObra,
  deleteManoDeObra,
} from "../actions";

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function OrdenTrabajoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [ot, aeronaves, activos, personal, mantenimientosPreventivos] = await Promise.all([
    prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        manoDeObra: { orderBy: { createdAt: "desc" }, include: { personal: true } },
      },
    }),
    prisma.aeronave.findMany({ orderBy: { matricula: "asc" } }),
    prisma.activo.findMany({ orderBy: { tipo: "asc" }, include: { aeronave: true } }),
    prisma.personal.findMany({ orderBy: [{ apellido: "asc" }, { nombre: "asc" }] }),
    prisma.mantenimientoPreventivo.findMany({ orderBy: { codigo: "asc" } }),
  ]);

  if (!ot) notFound();

  const updateOrdenTrabajoWithId = updateOrdenTrabajo.bind(null, ot.id);
  const deleteOrdenTrabajoWithId = deleteOrdenTrabajo.bind(null, ot.id);
  const createManoDeObraWithId = createManoDeObra.bind(null, ot.id);

  return (
    <div>
      <Link href="/admin/ordenes-trabajo" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Órdenes de Trabajo
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gris-900">{ot.codigo}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_OT_BADGE_CLASS[ot.estado]}`}
        >
          {ESTADO_OT_LABEL[ot.estado]}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDAD_OT_BADGE_CLASS[ot.prioridad]}`}
        >
          {PRIORIDAD_OT_LABEL[ot.prioridad]}
        </span>
      </div>
      <p className="mt-1 text-sm text-gris-500">
        Actualizado {ot.updatedAt.toLocaleString("es-AR")}
        {ot.actualizadoPor ? ` por ${ot.actualizadoPor}` : ""}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Datos de la orden</h2>
          <form action={updateOrdenTrabajoWithId} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Código *</label>
                <input
                  name="codigo"
                  required
                  defaultValue={ot.codigo}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Fecha *</label>
                <input
                  name="fecha"
                  type="date"
                  required
                  defaultValue={toDateInput(ot.fecha)}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">Descripción *</label>
              <textarea
                name="descripcion"
                required
                rows={2}
                defaultValue={ot.descripcion}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Tipo</label>
                <input
                  name="tipo"
                  defaultValue={ot.tipo ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Clase</label>
                <input
                  name="clase"
                  defaultValue={ot.clase ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Categoría</label>
                <input
                  name="categoria"
                  defaultValue={ot.categoria ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Estado</label>
                <select
                  name="estado"
                  defaultValue={ot.estado}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  {ESTADOS_OT.map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADO_OT_LABEL[estado]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Prioridad</label>
                <select
                  name="prioridad"
                  defaultValue={ot.prioridad}
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
                defaultValue={ot.departamento ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gris-100 pt-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Aeronave</label>
                <select
                  name="aeronaveId"
                  defaultValue={ot.aeronaveId ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin aeronave</option>
                  {aeronaves.map((aeronave) => (
                    <option key={aeronave.id} value={aeronave.id}>
                      {aeronave.matricula}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Activo</label>
                <select
                  name="activoId"
                  defaultValue={ot.activoId ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin activo específico</option>
                  {activos.map((activo) => (
                    <option key={activo.id} value={activo.id}>
                      {activo.tipo} {activo.aeronave ? `(${activo.aeronave.matricula})` : "(depósito)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gris-700">
                Plan de inspección / tarea (MP)
              </label>
              <select
                name="mantenimientoPreventivoId"
                defaultValue={ot.mantenimientoPreventivoId ?? ""}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Originador</label>
                <select
                  name="originadorId"
                  defaultValue={ot.originadorId ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin especificar</option>
                  {personal.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.apellido}, {persona.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Responsable</label>
                <select
                  name="responsableId"
                  defaultValue={ot.responsableId ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {personal.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.apellido}, {persona.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gris-100 pt-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Fecha inicio</label>
                <input
                  name="fechaInicio"
                  type="date"
                  defaultValue={toDateInput(ot.fechaInicio)}
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
                  defaultValue={toDateInput(ot.fechaFinPlanificado)}
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
                  defaultValue={ot.duracionEstimada ?? ""}
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
                  defaultValue={ot.duracionReal ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Fecha cerrado</label>
                <input
                  name="fechaCerrado"
                  type="date"
                  defaultValue={toDateInput(ot.fechaCerrado)}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gris-700">Falla</label>
              <textarea
                name="falla"
                rows={2}
                defaultValue={ot.falla ?? ""}
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
                  defaultValue={ot.costo ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Hs totales</label>
                <input
                  name="hsTotales"
                  type="number"
                  step="0.1"
                  defaultValue={ot.hsTotales ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gris-700">Comentarios</label>
              <textarea
                name="comentarios"
                rows={2}
                defaultValue={ot.comentarios ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar cambios
            </button>
          </form>

          <form action={deleteOrdenTrabajoWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar orden de trabajo
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Mano de obra</h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {ot.manoDeObra.map((entrada) => (
                <li key={entrada.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gris-900">
                        {entrada.personal
                          ? `${entrada.personal.apellido}, ${entrada.personal.nombre}`
                          : "Sin operario asignado"}
                        {entrada.horasTrabajadas != null && (
                          <span className="ml-2 text-xs text-gris-500">
                            {entrada.horasTrabajadas} hs
                          </span>
                        )}
                      </p>
                      {entrada.fecha && (
                        <p className="text-xs text-gris-500">
                          {entrada.fecha.toLocaleDateString("es-AR")}
                        </p>
                      )}
                      {entrada.tareas && (
                        <p className="mt-1 text-gris-600">{entrada.tareas}</p>
                      )}
                      {entrada.costo != null && (
                        <p className="text-xs text-gris-500">Costo: {entrada.costo}</p>
                      )}
                      {entrada.comentarios && (
                        <p className="mt-1 text-xs text-gris-500">{entrada.comentarios}</p>
                      )}
                    </div>
                    <form action={deleteManoDeObra.bind(null, ot.id, entrada.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </li>
              ))}
              {ot.manoDeObra.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Todavía no hay mano de obra cargada en esta OT.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Agregar mano de obra</h2>
            <form action={createManoDeObraWithId} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Operario</label>
                <select
                  name="personalId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin especificar</option>
                  {personal.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.apellido}, {persona.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Fecha</label>
                  <input
                    name="fecha"
                    type="date"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Horas trabajadas</label>
                  <input
                    name="horasTrabajadas"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Tareas</label>
                <textarea
                  name="tareas"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
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
                <label className="block text-xs font-medium text-gris-700">Comentarios</label>
                <textarea
                  name="comentarios"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-marron-600 py-2 text-sm font-medium text-white hover:bg-marron-700"
              >
                Agregar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
