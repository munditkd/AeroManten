import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateActivo, deleteActivo } from "../actions";
import { createMantenimiento, deleteMantenimiento } from "../../aeronaves/actions";
import {
  calcularVencimiento,
  ESTADO_LABEL,
  ESTADO_BADGE_CLASS,
} from "@/lib/mantenimiento-preventivo";

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

export default async function ActivoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [activo, aeronaves, relacionesMP] = await Promise.all([
    prisma.activo.findUnique({
      where: { id },
      include: {
        aeronave: true,
        mantenimientos: { orderBy: { fecha: "desc" } },
      },
    }),
    prisma.aeronave.findMany({ orderBy: { matricula: "asc" } }),
    prisma.activoMantenimientoPreventivo.findMany({
      where: { activoId: id },
      include: {
        mantenimientoPreventivo: true,
        realizaciones: { orderBy: { fecha: "desc" }, take: 1 },
      },
    }),
  ]);

  if (!activo) notFound();

  const mpConVencimiento = relacionesMP.map((relacion) => {
    const ultima = relacion.realizaciones[0] ?? null;
    const venc = calcularVencimiento({
      mp: relacion.mantenimientoPreventivo,
      activoHoras: activo.horasTSN,
      activoCiclos: activo.ciclosTSN,
      ultimaRealizacion: ultima
        ? { fecha: ultima.fecha, horas: ultima.horas, ciclos: ultima.ciclos }
        : null,
    });
    return { relacion, venc };
  });

  const updateActivoWithId = updateActivo.bind(null, activo.id);
  const deleteActivoWithId = deleteActivo.bind(null, activo.id);

  return (
    <div>
      {activo.aeronave ? (
        <Link
          href={`/admin/aeronaves/${activo.aeronaveId}`}
          className="text-sm text-gris-500 hover:text-celeste-700"
        >
          ← {activo.aeronave.matricula}
        </Link>
      ) : (
        <Link
          href="/admin/activos"
          className="text-sm text-gris-500 hover:text-celeste-700"
        >
          ← Activos
        </Link>
      )}

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {activo.tipo}
      </h1>
      <p className="mt-1 text-sm text-gris-500">Código {activo.codigo}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">
            Datos del componente
          </h2>
          <form action={updateActivoWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Aeronave
              </label>
              <select
                name="aeronaveId"
                defaultValue={activo.aeronaveId ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              >
                <option value="">Sin aeronave (en depósito)</option>
                {aeronaves.map((aeronave) => (
                  <option key={aeronave.id} value={aeronave.id}>
                    {aeronave.matricula}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gris-400">
                Cambiá o vaciá este campo para montar/desmontar el componente.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Tipo *
              </label>
              <input
                name="tipo"
                required
                list="tipos-activo"
                defaultValue={activo.tipo}
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
                  defaultValue={activo.marca ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Número de Parte
                </label>
                <input
                  name="modelo"
                  defaultValue={activo.modelo ?? ""}
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
                defaultValue={activo.numeroSerie ?? ""}
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
                defaultValue={toDateInput(activo.fechaFabricacion)}
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
                  defaultValue={activo.horasTSN ?? ""}
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
                  defaultValue={activo.horasTSO ?? ""}
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
                  defaultValue={activo.ciclosTSN ?? ""}
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
                  defaultValue={activo.ciclosTSO ?? ""}
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
                  defaultValue={activo.mesesTSN ?? ""}
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
                  defaultValue={activo.mesesTSO ?? ""}
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

          <form action={deleteActivoWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar componente
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
                href="/admin/activos/relacionar-mp"
                className="text-xs font-medium text-celeste-700 hover:underline"
              >
                Relacionar más MP
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-gris-100">
              {mpConVencimiento.map(({ relacion, venc }) => (
                <li key={relacion.id} className="py-3">
                  <Link
                    href={`/admin/activos/relacionar-mp/${relacion.id}`}
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
                  Este activo todavía no tiene MP relacionados.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Historial de mantenimiento
            </h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {activo.mantenimientos.map((registro) => (
                <li
                  key={registro.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm text-gris-900">
                      {registro.descripcion}
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
              {activo.mantenimientos.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Todavía no hay registros de mantenimiento.
                </li>
              )}
            </ul>
          </div>

          {activo.aeronaveId ? (
            <div className="rounded-lg border border-gris-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gris-900">
                Agregar registro
              </h2>
              <form action={createMantenimiento} className="mt-4 space-y-3">
                <input type="hidden" name="aeronaveId" value={activo.aeronaveId} />
                <input type="hidden" name="activoId" value={activo.id} />
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
          ) : (
            <div className="rounded-lg border border-gris-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gris-900">
                Agregar registro
              </h2>
              <p className="mt-4 text-sm text-gris-500">
                Este componente está en depósito, sin aeronave asociada. Montalo en
                una aeronave para poder cargar registros de mantenimiento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
