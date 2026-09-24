import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TABLAS_ESTADO, RSTATUS_OPCIONES } from "@/lib/estados";
import { createEstado } from "./actions";

export default async function EstadosPage() {
  const estados = await prisma.estado.findMany({
    orderBy: [{ tabla: "asc" }, { propiedad: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Estados</h1>
      <p className="mt-1 text-sm text-gris-500">
        Tabla genérica de estados usada por Órdenes de Trabajo, Activos y
        Aeronaves. RSTATUS es la categoría fija de la que depende el color y
        la lógica del sistema; STATUS es la etiqueta que ves en pantalla.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
              <tr>
                <th className="px-4 py-3">Tabla</th>
                <th className="px-4 py-3">Propiedad</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">RSTATUS</th>
                <th className="px-4 py-3">No usar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gris-100">
              {estados.map((estado) => (
                <tr key={estado.id} className="hover:bg-gris-50">
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">{estado.tabla}</td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {estado.propiedad}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/estados/${estado.id}`}
                      className="font-medium text-celeste-700 hover:underline"
                    >
                      {estado.status}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {estado.rstatus}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {estado.noUsar ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        No usar
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {estados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gris-500">
                    Todavía no hay estados cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nuevo estado</h2>
            <form action={createEstado} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Tabla *</label>
                <select
                  name="tabla"
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="" disabled>
                    Seleccioná una tabla
                  </option>
                  {TABLAS_ESTADO.map((tabla) => (
                    <option key={tabla} value={tabla}>
                      {tabla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Propiedad *</label>
                <input
                  name="propiedad"
                  required
                  defaultValue="estado"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gris-400">
                  Por ahora siempre "estado"; queda libre para usos futuros.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Status *</label>
                <input
                  name="status"
                  required
                  placeholder="Ej: Pendiente"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">RSTATUS *</label>
                <select
                  name="rstatus"
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="" disabled>
                    Seleccioná un RSTATUS
                  </option>
                  {RSTATUS_OPCIONES.map((rstatus) => (
                    <option key={rstatus} value={rstatus}>
                      {rstatus}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gris-400">
                  Para OT: ABIERTA/CERRADA. Para Activo/Aeronave:
                  OPERATIVO/NO_OPERATIVO/BAJA.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gris-700">
                <input name="noUsar" type="checkbox" className="rounded border-gris-300" />
                No usar
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear estado
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
