import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createServicio } from "./actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";

const UNIDADES_MEDIDA_SUGERIDAS = ["Hora", "Mes", "Visita", "Servicio", "Unidad"];

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ claseId?: string }>;
}) {
  const { claseId } = await searchParams;

  const [servicios, clases, categorias] = await Promise.all([
    prisma.servicio.findMany({
      where: claseId ? { claseId } : {},
      orderBy: { nombre: "asc" },
      include: { clase: true, categoria: true },
    }),
    obtenerClases("Servicio"),
    obtenerCategoriasDeEntidad("Servicio"),
  ]);

  const pill = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? "border-celeste-700 bg-celeste-700 text-white"
        : "border-gris-300 text-gris-700 hover:bg-gris-50"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Servicios</h1>
      <p className="mt-1 text-sm text-gris-500">
        Servicios contratables a Proveedores (limpieza, internet, mecánicos, etc.), usados como lo
        pedido en Requerimientos de tipo Servicio.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href="/admin/servicios" className={pill(!claseId)}>
              Todos los Servicios
            </Link>
            {clases.map((clase) => (
              <Link
                key={clase.id}
                href={`/admin/servicios?claseId=${clase.id}`}
                className={pill(claseId === clase.id)}
              >
                {clase.nombre}
              </Link>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Clase</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {servicios.map((servicio) => (
                  <tr key={servicio.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/servicios/${servicio.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {servicio.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {servicio.clase?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {servicio.categoria?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {servicio.unidadMedida}
                    </td>
                  </tr>
                ))}
                {servicios.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gris-500">
                      {claseId ? "No hay servicios con esa clase." : "Todavía no hay servicios cargados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nuevo servicio</h2>
            <ActionForm action={createServicio} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Nombre *</label>
                <input
                  name="nombre"
                  required
                  placeholder="Ej: Limpieza de oficinas"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Unidad de medida *
                </label>
                <input
                  name="unidadMedida"
                  required
                  list="unidades-medida-servicio"
                  placeholder="Hora, mes, visita..."
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
                <datalist id="unidades-medida-servicio">
                  {UNIDADES_MEDIDA_SUGERIDAS.map((unidad) => (
                    <option key={unidad} value={unidad} />
                  ))}
                </datalist>
              </div>

              <ClaseCategoriaSelector clases={clases} categorias={categorias} />

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear servicio
              </button>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
