import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  createPiezaClase,
  deletePiezaClase,
  createPiezaCategoria,
  deletePiezaCategoria,
} from "./actions";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";

export default async function PiezasClasesPage() {
  const clases = await prisma.piezaClase.findMany({
    orderBy: { nombre: "asc" },
    include: { categorias: { orderBy: { nombre: "asc" } } },
  });

  return (
    <div>
      <Link href="/admin/piezas" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Piezas
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        Clases y Categorías de Piezas
      </h1>
      <p className="mt-1 text-sm text-gris-500">
        Catálogo para agrupar Piezas. Cada Categoría pertenece a una Clase.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {clases.map((clase) => {
            const deleteClaseWithId = deletePiezaClase.bind(null, clase.id);
            const createCategoriaWithId = createPiezaCategoria.bind(null, clase.id);

            return (
              <div key={clase.id} className="rounded-lg border border-gris-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gris-900">{clase.nombre}</h2>
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
                    const deleteCategoriaWithId = deletePiezaCategoria.bind(null, categoria.id);
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

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nueva clase</h2>
            <ActionForm action={createPiezaClase} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Nombre *</label>
                <input
                  name="nombre"
                  required
                  placeholder="Ej: Lubricantes"
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
