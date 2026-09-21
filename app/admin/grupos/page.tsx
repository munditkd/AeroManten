import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createGrupo } from "./actions";

export default async function GruposPage() {
  const grupos = await prisma.grupo.findMany({
    orderBy: { codigo: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Grupos</h1>
      <p className="mt-1 text-sm text-gris-500">
        Grupos de personal. Más adelante van a definir los permisos sobre
        cada entidad del sistema.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Insertar</th>
                <th className="px-4 py-3">Modificar</th>
                <th className="px-4 py-3">Borrar</th>
                <th className="px-4 py-3">No usar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gris-100">
              {grupos.map((grupo) => (
                <tr key={grupo.id} className="hover:bg-gris-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/grupos/${grupo.id}`}
                      className="font-medium text-celeste-700 hover:underline"
                    >
                      {grupo.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gris-600">{grupo.descripcion}</td>
                  <td className="px-4 py-3 text-gris-600">{grupo.insertar ? "Sí" : "—"}</td>
                  <td className="px-4 py-3 text-gris-600">{grupo.modificar ? "Sí" : "—"}</td>
                  <td className="px-4 py-3 text-gris-600">{grupo.borrar ? "Sí" : "—"}</td>
                  <td className="px-4 py-3 text-gris-600">
                    {grupo.noUsar ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        No usar
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {grupos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gris-500">
                    Todavía no hay grupos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nuevo grupo</h2>
            <form action={createGrupo} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Código *
                </label>
                <input
                  name="codigo"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
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

              <div className="grid grid-cols-2 gap-2 border-t border-gris-100 pt-3">
                <label className="flex items-center gap-2 text-sm text-gris-700">
                  <input name="insertar" type="checkbox" className="rounded border-gris-300" />
                  Insertar
                </label>
                <label className="flex items-center gap-2 text-sm text-gris-700">
                  <input name="modificar" type="checkbox" className="rounded border-gris-300" />
                  Modificar
                </label>
                <label className="flex items-center gap-2 text-sm text-gris-700">
                  <input name="borrar" type="checkbox" className="rounded border-gris-300" />
                  Borrar
                </label>
                <label className="flex items-center gap-2 text-sm text-gris-700">
                  <input name="noUsar" type="checkbox" className="rounded border-gris-300" />
                  No usar
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear grupo
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
