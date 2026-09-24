import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  calcularVencimiento,
  ESTADO_LABEL,
  ESTADO_BADGE_CLASS,
} from "@/lib/mantenimiento-preventivo";
import { createRelaciones } from "./actions";

export default async function RelacionarActivosMPPage() {
  const [relaciones, activos, aeronaves, mps] = await Promise.all([
    prisma.activoMantenimientoPreventivo.findMany({
      include: {
        activo: { include: { aeronave: true } },
        aeronave: true,
        mantenimientoPreventivo: true,
        realizaciones: { orderBy: { fecha: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activo.findMany({
      orderBy: { tipo: "asc" },
      include: { aeronave: true },
    }),
    prisma.aeronave.findMany({ orderBy: { matricula: "asc" } }),
    prisma.mantenimientoPreventivo.findMany({ orderBy: { codigo: "asc" } }),
  ]);

  return (
    <div>
      <Link
        href="/admin/activos"
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← Activos
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        Relacionar Activos/Aeronaves con MP
      </h1>
      <p className="mt-1 text-sm text-gris-500">
        Vinculá cada activo o aeronave con los mantenimientos preventivos que le
        aplican (por ejemplo una Recorrida General a toda la aeronave).
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Aeronave</th>
                  <th className="px-4 py-3">MP</th>
                  <th className="px-4 py-3">Última realización</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {relaciones.map((relacion) => {
                  const ultima = relacion.realizaciones[0] ?? null;
                  const horas = relacion.aeronave
                    ? relacion.aeronave.horasTSN
                    : relacion.activo?.horasTSN ?? null;
                  const ciclos = relacion.aeronave
                    ? relacion.aeronave.ciclosTSN
                    : relacion.activo?.ciclosTSN ?? null;
                  const venc = calcularVencimiento({
                    mp: relacion.mantenimientoPreventivo,
                    activoHoras: horas,
                    activoCiclos: ciclos,
                    ultimaRealizacion: ultima
                      ? { fecha: ultima.fecha, horas: ultima.horas, ciclos: ultima.ciclos }
                      : null,
                  });
                  const matricula = relacion.aeronave?.matricula ?? relacion.activo?.aeronave?.matricula;
                  return (
                    <tr key={relacion.id} className="hover:bg-gris-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/admin/mantenimiento-preventivo/relacionar-mp/${relacion.id}`}
                          className="font-medium text-celeste-700 hover:underline"
                        >
                          {relacion.aeronave
                            ? "Aeronave completa"
                            : relacion.activo?.tipo}
                        </Link>
                        <p className="text-xs text-gris-500">
                          {relacion.aeronave
                            ? relacion.aeronave.matricula
                            : relacion.activo?.numeroSerie ?? "Sin N/S"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                        {matricula ?? "En depósito"}
                      </td>
                      <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                        <span className="font-medium text-gris-900">
                          {relacion.mantenimientoPreventivo.codigo}
                        </span>{" "}
                        {relacion.mantenimientoPreventivo.descripcion}
                      </td>
                      <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                        {ultima ? ultima.fecha.toLocaleDateString("es-AR") : "Nunca"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE_CLASS[venc.estado]}`}
                        >
                          {ESTADO_LABEL[venc.estado]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {relaciones.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gris-500">
                      Todavía no hay activos ni aeronaves relacionados con MP.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Nueva relación
            </h2>
            {(activos.length === 0 && aeronaves.length === 0) || mps.length === 0 ? (
              <p className="mt-4 text-sm text-gris-500">
                Necesitás tener al menos un{" "}
                <Link href="/admin/activos" className="text-celeste-700 hover:underline">
                  activo
                </Link>{" "}
                o{" "}
                <Link href="/admin/aeronaves" className="text-celeste-700 hover:underline">
                  aeronave
                </Link>{" "}
                y un{" "}
                <Link
                  href="/admin/mantenimiento-preventivo"
                  className="text-celeste-700 hover:underline"
                >
                  mantenimiento preventivo
                </Link>{" "}
                cargados.
              </p>
            ) : (
              <form action={createRelaciones} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Aeronave o activo *
                  </label>
                  <select
                    name="destino"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    <option value="" disabled>
                      Seleccioná un destino
                    </option>
                    {aeronaves.length > 0 && (
                      <optgroup label="Aeronaves (mantenimiento completo, ej. Recorrida General)">
                        {aeronaves.map((aeronave) => (
                          <option key={aeronave.id} value={`aeronave:${aeronave.id}`}>
                            {aeronave.matricula}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {activos.length > 0 && (
                      <optgroup label="Activos (componentes)">
                        {activos.map((activo) => (
                          <option key={activo.id} value={`activo:${activo.id}`}>
                            {activo.tipo} — {activo.numeroSerie ?? "S/N"} (
                            {activo.aeronave?.matricula ?? "depósito"})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Mantenimientos preventivos *
                  </label>
                  <div className="mt-1 max-h-64 space-y-1 overflow-y-auto rounded-md border border-gris-300 p-2">
                    {mps.map((mp) => (
                      <label
                        key={mp.id}
                        className="flex items-start gap-2 rounded px-1 py-1 text-sm hover:bg-gris-50"
                      >
                        <input
                          type="checkbox"
                          name="mpIds"
                          value={mp.id}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium text-gris-900">{mp.codigo}</span>{" "}
                          <span className="text-gris-600">{mp.descripcion}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
                >
                  Relacionar
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
