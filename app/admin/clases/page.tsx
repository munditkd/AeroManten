import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ENTIDADES_CLASE, labelEntidad } from "@/lib/clases";
import { createClase, deleteClase, createCategoria, deleteCategoria } from "./actions";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";

export default async function ClasesPage({
  searchParams,
}: {
  searchParams: Promise<{ entidad?: string }>;
}) {
  const { entidad } = await searchParams;
  const entidadActiva = ENTIDADES_CLASE.some((e) => e.entidad === entidad) ? entidad : undefined;

  const clases = await prisma.clase.findMany({
    where: entidadActiva ? { entidad: entidadActiva } : {},
    orderBy: [{ entidad: "asc" }, { nombre: "asc" }],
    include: { categorias: { orderBy: { nombre: "asc" } } },
  });

  const pill = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? "border-celeste-700 bg-celeste-700 text-white"
        : "border-gris-300 text-gris-700 hover:bg-gris-50"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Clases y Categorías</h1>
      <p className="mt-1 text-sm text-gris-500">
        Catálogo compartido para agrupar Aeronaves, Activos, Piezas, Mantenimiento Preventivo y
        Órdenes de Trabajo. Cada Categoría pertenece a una Clase, y cada Clase es de una sola
        entidad.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Link href="/admin/clases" className={pill(!entidadActiva)}>
              Todas
            </Link>
            {ENTIDADES_CLASE.map((e) => (
              <Link
                key={e.entidad}
                href={`/admin/clases?entidad=${e.entidad}`}
                className={pill(entidadActiva === e.entidad)}
              >
                {e.label}
              </Link>
            ))}
          </div>

          <div className="space-y-4">
            {clases.map((clase) => {
              const deleteClaseWithId = deleteClase.bind(null, clase.id);
              const createCategoriaWithId = createCategoria.bind(null, clase.id);

              return (
                <div key={clase.id} className="rounded-lg border border-gris-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="rounded-full bg-gris-100 px-2 py-0.5 text-xs font-medium text-gris-600">
                        {labelEntidad(clase.entidad)}
                      </span>
                      <h2 className="mt-1 text-sm font-semibold text-gris-900">{clase.nombre}</h2>
                    </div>
                    <ConfirmDeleteButton
                      action={deleteClaseWithId}
                      mensaje={`¿Eliminar la clase "${clase.nombre}"?`}
                      className="text-xs font-medium text-red-500 hover:underline"
                    >
                      Eliminar clase
                    </ConfirmDeleteButton>
                  </div>

                  <ul className="mt-3 divide-y divide-gris-100">
                    {clase.categorias.map((categoria) => {
                      const deleteCategoriaWithId = deleteCategoria.bind(null, categoria.id);
                      return (
                        <li
                          key={categoria.id}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="text-gris-700">{categoria.nombre}</span>
                          <ConfirmDeleteButton
                            action={deleteCategoriaWithId}
                            mensaje={`¿Eliminar la categoría "${categoria.nombre}"?`}
                            className="text-xs font-medium text-red-500 hover:underline"
                          >
                            Eliminar
                          </ConfirmDeleteButton>
                        </li>
                      );
                    })}
                    {clase.categorias.length === 0 && (
                      <li className="py-2 text-sm text-gris-500">Sin categorías todavía.</li>
                    )}
                  </ul>

                  <ActionForm action={createCategoriaWithId} className="mt-3 flex gap-2">
                    <input
                      name="nombre"
                      required
                      placeholder="Nueva categoría"
                      className="flex-1 rounded-md border border-gris-300 px-3 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-celeste-700 px-3 py-1.5 text-sm font-medium text-celeste-700 hover:bg-celeste-50"
                    >
                      Agregar
                    </button>
                  </ActionForm>
                </div>
              );
            })}
            {clases.length === 0 && (
              <p className="text-sm text-gris-500">Todavía no hay clases cargadas.</p>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nueva clase</h2>
            <ActionForm action={createClase} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Entidad *</label>
                <select
                  name="entidad"
                  required
                  defaultValue={entidadActiva ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="" disabled>
                    Seleccioná una entidad
                  </option>
                  {ENTIDADES_CLASE.map((e) => (
                    <option key={e.entidad} value={e.entidad}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Nombre *</label>
                <input
                  name="nombre"
                  required
                  placeholder="Ej: Motor"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear clase
              </button>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
