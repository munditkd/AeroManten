import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createRequerimiento } from "./actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";
import { claseBadgeEstado } from "@/lib/estados";
import { TIPOS_REQUERIMIENTO, TIPO_REQUERIMIENTO_LABEL } from "@/lib/requerimientos";

export default async function RequerimientosPage() {
  const [requerimientos, clases, categorias] = await Promise.all([
    prisma.requerimiento.findMany({
      orderBy: { createdAt: "desc" },
      include: { clase: true, categoria: true, estado: true, _count: { select: { items: true } } },
    }),
    obtenerClases("Requerimiento"),
    obtenerCategoriasDeEntidad("Requerimiento"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Requerimientos</h1>
      <p className="mt-1 text-sm text-gris-500">
        Pedidos de cotización de Productos o Servicios, enviados por mail a Proveedores.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Rubro</th>
                <th className="px-4 py-3">Ítems</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gris-100">
              {requerimientos.map((req) => (
                <tr key={req.id} className="hover:bg-gris-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/requerimientos/${req.id}`}
                      className="font-medium text-celeste-700 hover:underline"
                    >
                      {req.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gris-600">{req.titulo}</td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {TIPO_REQUERIMIENTO_LABEL[req.tipo]}
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {req.clase?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">{req._count.items}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${claseBadgeEstado(req.estado.rstatus)}`}
                    >
                      {req.estado.status}
                    </span>
                  </td>
                </tr>
              ))}
              {requerimientos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gris-500">
                    Todavía no hay requerimientos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nuevo requerimiento</h2>
            <p className="mt-1 text-xs text-gris-400">
              El código se asigna solo (REQ-00001, REQ-00002...) al guardar. Los ítems y el envío
              a Proveedores se cargan después, desde el detalle.
            </p>
            <ActionForm action={createRequerimiento} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Título *</label>
                <input
                  name="titulo"
                  required
                  placeholder="Ej: Repuestos para inspección 100 hs"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Tipo *</label>
                <select
                  name="tipo"
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="" disabled>
                    Elegí un tipo
                  </option>
                  {TIPOS_REQUERIMIENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_REQUERIMIENTO_LABEL[tipo]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <ClaseCategoriaSelector clases={clases} categorias={categorias} />

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear requerimiento
              </button>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
