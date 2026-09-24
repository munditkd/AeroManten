import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  updateAeronave,
  deleteAeronave,
  createMantenimiento,
  deleteMantenimiento,
} from "../actions";
import { createActivo } from "../../activos/actions";
import {
  calcularVencimiento,
  ESTADO_LABEL,
  ESTADO_BADGE_CLASS,
} from "@/lib/mantenimiento-preventivo";
import { obtenerEstados } from "@/lib/estados";

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

const TIPOS_ACTIVO_SUGERIDOS = [
  "Motor",
  "Hélice",
  "Transponder",
  "Tren de aterrizaje",
  "Batería",
  "Instrumento",
];

export default async function AeronaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [aeronave, relacionesMP, estados] = await Promise.all([
    prisma.aeronave.findUnique({
      where: { id },
      include: {
        propietario: true,
        activos: { orderBy: { tipo: "asc" } },
        mantenimientos: {
          orderBy: { fecha: "desc" },
          include: { activo: true },
        },
      },
    }),
    prisma.activoMantenimientoPreventivo.findMany({
      where: { aeronaveId: id },
      include: {
        mantenimientoPreventivo: true,
        realizaciones: { orderBy: { fecha: "desc" }, take: 1 },
      },
    }),
    obtenerEstados("Aeronave"),
  ]);

  if (!aeronave) notFound();

  const mpConVencimiento = relacionesMP.map((relacion) => {
    const ultima = relacion.realizaciones[0] ?? null;
    const venc = calcularVencimiento({
      mp: relacion.mantenimientoPreventivo,
      activoHoras: aeronave.horasTSN,
      activoCiclos: aeronave.ciclosTSN,
      ultimaRealizacion: ultima
        ? { fecha: ultima.fecha, horas: ultima.horas, ciclos: ultima.ciclos }
        : null,
    });
    return { relacion, venc };
  });

  const updateAeronaveWithId = updateAeronave.bind(null, aeronave.id);
  const deleteAeronaveWithId = deleteAeronave.bind(null, aeronave.id);

  return (
    <div>
      <Link
        href={`/admin/propietarios/${aeronave.propietarioId}`}
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← {aeronave.propietario.nombre}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {aeronave.matricula}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">
            Datos de la aeronave
          </h2>
          <form action={updateAeronaveWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Matrícula *
              </label>
              <input
                name="matricula"
                required
                defaultValue={aeronave.matricula}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm uppercase focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Estado
              </label>
              <select
                name="estadoId"
                defaultValue={aeronave.estadoId ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              >
                <option value="">Sin clasificar</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Fabricante
                </label>
                <input
                  name="marca"
                  defaultValue={aeronave.marca ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Número de Parte
                </label>
                <input
                  name="modelo"
                  defaultValue={aeronave.modelo ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Número de serie
              </label>
              <input
                name="numeroSerie"
                defaultValue={aeronave.numeroSerie ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Fecha de fabricación
              </label>
              <input
                name="fechaFabricacion"
                type="date"
                defaultValue={toDateInput(aeronave.fechaFabricacion)}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Horas TSN
                </label>
                <input
                  name="horasTSN"
                  type="number"
                  step="0.1"
                  defaultValue={aeronave.horasTSN ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Horas TSO
                </label>
                <input
                  name="horasTSO"
                  type="number"
                  step="0.1"
                  defaultValue={aeronave.horasTSO ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Ciclos TSN
                </label>
                <input
                  name="ciclosTSN"
                  type="number"
                  defaultValue={aeronave.ciclosTSN ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Ciclos TSO
                </label>
                <input
                  name="ciclosTSO"
                  type="number"
                  defaultValue={aeronave.ciclosTSO ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Meses TSN
                </label>
                <input
                  name="mesesTSN"
                  type="number"
                  defaultValue={aeronave.mesesTSN ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Meses TSO
                </label>
                <input
                  name="mesesTSO"
                  type="number"
                  defaultValue={aeronave.mesesTSO ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar cambios
            </button>
          </form>

          <form action={deleteAeronaveWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar aeronave
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gris-900">
                Mantenimientos Preventivos
              </h2>
              <Link
                href="/admin/mantenimiento-preventivo/relacionar-mp"
                className="text-xs font-medium text-celeste-700 hover:underline"
              >
                Relacionar más MP
              </Link>
            </div>
            <p className="mt-1 text-xs text-gris-500">
              MP aplicados a la aeronave completa (ej. Recorrida General).
            </p>
            <ul className="mt-4 divide-y divide-gris-100">
              {mpConVencimiento.map(({ relacion, venc }) => (
                <li key={relacion.id} className="py-3">
                  <Link
                    href={`/admin/mantenimiento-preventivo/relacionar-mp/${relacion.id}`}
                    className="font-medium text-celeste-700 hover:underline"
                  >
                    {relacion.mantenimientoPreventivo.codigo}
                  </Link>{" "}
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE_CLASS[venc.estado]}`}
                  >
                    {ESTADO_LABEL[venc.estado]}
                  </span>
                  <p className="text-xs text-gris-500">
                    {relacion.mantenimientoPreventivo.descripcion}
                  </p>
                </li>
              ))}
              {mpConVencimiento.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Esta aeronave todavía no tiene MP relacionados.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Componentes / Activos
            </h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {aeronave.activos.map((activo) => (
                <li key={activo.id} className="py-3">
                  <Link
                    href={`/admin/activos/${activo.id}`}
                    className="font-medium text-celeste-700 hover:underline"
                  >
                    {activo.tipo}
                  </Link>
                  <p className="text-xs text-gris-500">
                    {[activo.marca, activo.modelo].filter(Boolean).join(" ") ||
                      "Sin marca/modelo cargado"}
                  </p>
                </li>
              ))}
              {aeronave.activos.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Todavía no hay componentes cargados.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Agregar componente
            </h2>
            <form action={createActivo} className="mt-4 space-y-3">
              <input type="hidden" name="aeronaveId" value={aeronave.id} />
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Tipo *
                </label>
                <input
                  name="tipo"
                  required
                  list="tipos-activo"
                  placeholder="Motor, hélice, transponder..."
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
                <datalist id="tipos-activo">
                  {TIPOS_ACTIVO_SUGERIDOS.map((tipo) => (
                    <option key={tipo} value={tipo} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Fabricante
                  </label>
                  <input
                    name="marca"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Número de Parte
                  </label>
                  <input
                    name="modelo"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Número de serie
                </label>
                <input
                  name="numeroSerie"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Fecha de fabricación
                </label>
                <input
                  name="fechaFabricacion"
                  type="date"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Horas TSN
                  </label>
                  <input
                    name="horasTSN"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Horas TSO
                  </label>
                  <input
                    name="horasTSO"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Ciclos TSN
                  </label>
                  <input
                    name="ciclosTSN"
                    type="number"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Ciclos TSO
                  </label>
                  <input
                    name="ciclosTSO"
                    type="number"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Meses TSN
                  </label>
                  <input
                    name="mesesTSN"
                    type="number"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Meses TSO
                  </label>
                  <input
                    name="mesesTSO"
                    type="number"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-marron-600 py-2 text-sm font-medium text-white hover:bg-marron-700"
              >
                Agregar componente
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Historial de mantenimiento
            </h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {aeronave.mantenimientos.map((registro) => (
                <li
                  key={registro.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm text-gris-900">
                      {registro.descripcion}
                      {registro.activo && (
                        <span className="ml-2 rounded-full bg-gris-100 px-2 py-0.5 text-xs text-gris-600">
                          {registro.activo.tipo}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gris-500">
                      {registro.fecha.toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <form action={deleteMantenimiento.bind(null, registro.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </form>
                </li>
              ))}
              {aeronave.mantenimientos.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Todavía no hay registros de mantenimiento.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Agregar registro
            </h2>
            <form action={createMantenimiento} className="mt-4 space-y-3">
              <input type="hidden" name="aeronaveId" value={aeronave.id} />
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Componente
                </label>
                <select
                  name="activoId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">General (toda la aeronave)</option>
                  {aeronave.activos.map((activo) => (
                    <option key={activo.id} value={activo.id}>
                      {activo.tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Fecha *
                </label>
                <input
                  name="fecha"
                  type="date"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Descripción *
                </label>
                <textarea
                  name="descripcion"
                  required
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-marron-600 py-2 text-sm font-medium text-white hover:bg-marron-700"
              >
                Agregar registro
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
