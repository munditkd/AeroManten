import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createMantenimientoPreventivo } from "./actions";

export default async function MantenimientoPreventivoPage() {
  const items = await prisma.mantenimientoPreventivo.findMany({
    orderBy: { codigo: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Mantenimiento Preventivo</h1>
      <p className="mt-1 text-sm text-gris-500">
        Catálogo de tareas de mantenimiento preventivo, con sus intervalos y recursos necesarios.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-2">
            <Link
              href="/admin/mantenimiento-preventivo/relacionar-mp"
              className="rounded-lg border border-gris-200 bg-white px-4 py-2 text-sm font-medium text-celeste-700 hover:bg-celeste-50"
            >
              Relacionar Activos/Aeronaves con MP
            </Link>
            <Link
              href="/admin/mantenimiento-preventivo/vencimientos-mp"
              className="rounded-lg border border-gris-200 bg-white px-4 py-2 text-sm font-medium text-celeste-700 hover:bg-celeste-50"
            >
              Listado de MP con Vencimiento
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Horas</th>
                  <th className="px-4 py-3">Ciclos</th>
                  <th className="px-4 py-3">Meses</th>
                  <th className="px-4 py-3">Tarea</th>
                  <th className="px-4 py-3">Personas</th>
                  <th className="px-4 py-3">Horas-hombre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/mantenimiento-preventivo/${item.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {item.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {item.descripcion}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {item.horas ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {item.ciclos ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {item.meses ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600">
                      <span className="block max-w-xs truncate" title={item.tarea}>
                        {item.tarea}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {item.personas ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {item.horasHombre ?? "—"}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-gris-500"
                    >
                      Todavía no hay tareas de mantenimiento preventivo cargadas.
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
              Nueva tarea
            </h2>
            <form action={createMantenimientoPreventivo} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Código *
                </label>
                <input
                  name="codigo"
                  required
                  placeholder="MP-001"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm uppercase focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Descripción *
                </label>
                <input
                  name="descripcion"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Horas
                  </label>
                  <input
                    name="horas"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Ciclos
                  </label>
                  <input
                    name="ciclos"
                    type="number"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Meses
                  </label>
                  <input
                    name="meses"
                    type="number"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Tarea *
                </label>
                <textarea
                  name="tarea"
                  required
                  rows={4}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Personas
                  </label>
                  <input
                    name="personas"
                    type="number"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Horas-hombre
                  </label>
                  <input
                    name="horasHombre"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear tarea
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
