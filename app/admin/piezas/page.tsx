import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPieza } from "./actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";

const UNIDADES_MEDIDA_SUGERIDAS = ["Unidad", "Metro", "Litro", "Kilogramo", "Caja", "Par"];

export default async function PiezasPage({
  searchParams,
}: {
  searchParams: Promise<{ claseId?: string }>;
}) {
  const { claseId } = await searchParams;

  const [piezas, clases, categorias] = await Promise.all([
    prisma.pieza.findMany({
      where: claseId ? { claseId } : {},
      orderBy: { nombre: "asc" },
      include: { clase: true, categoria: true },
    }),
    obtenerClases("Pieza"),
    obtenerCategoriasDeEntidad("Pieza"),
  ]);

  const pill = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? "border-celeste-700 bg-celeste-700 text-white"
        : "border-gris-300 text-gris-700 hover:bg-gris-50"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Piezas</h1>
      <p className="mt-1 text-sm text-gris-500">
        Insumos sin número de serie usados en mantenimiento (caños, aceite, grasa, etc.), con
        unidad de medida y stock propios. Se consumen desde las Tareas de una Orden de Trabajo.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href="/admin/piezas" className={pill(!claseId)}>
              Todas las Piezas
            </Link>
            {clases.map((clase) => (
              <Link
                key={clase.id}
                href={`/admin/piezas?claseId=${clase.id}`}
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
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Clase</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {piezas.map((pieza) => (
                  <tr key={pieza.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">{pieza.codigo}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/piezas/${pieza.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {pieza.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {pieza.clase?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {pieza.categoria?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {pieza.unidadMedida}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">{pieza.stock}</td>
                  </tr>
                ))}
                {piezas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gris-500">
                      {claseId ? "No hay piezas con esa clase." : "Todavía no hay piezas cargadas."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nueva pieza</h2>
            <ActionForm action={createPieza} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Nombre *</label>
                <input
                  name="nombre"
                  required
                  placeholder="Ej: Aceite lubricante 20W50"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Unidad de medida *
                  </label>
                  <input
                    name="unidadMedida"
                    required
                    list="unidades-medida"
                    placeholder="Metro, litro, unidad..."
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                  <datalist id="unidades-medida">
                    {UNIDADES_MEDIDA_SUGERIDAS.map((unidad) => (
                      <option key={unidad} value={unidad} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Stock inicial</label>
                  <input
                    name="stock"
                    type="number"
                    step="0.01"
                    defaultValue={0}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>

              <ClaseCategoriaSelector clases={clases} categorias={categorias} />

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear pieza
              </button>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
