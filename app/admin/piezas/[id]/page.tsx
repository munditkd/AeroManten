import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePieza, deletePieza } from "../actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";

const UNIDADES_MEDIDA_SUGERIDAS = ["Unidad", "Metro", "Litro", "Kilogramo", "Caja", "Par"];

export default async function PiezaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [pieza, clases, categorias] = await Promise.all([
    prisma.pieza.findUnique({
      where: { id },
      include: {
        usos: {
          orderBy: { createdAt: "desc" },
          include: { tarea: { include: { ordenTrabajo: true } } },
        },
      },
    }),
    obtenerClases("Pieza"),
    obtenerCategoriasDeEntidad("Pieza"),
  ]);

  if (!pieza) notFound();

  const updatePiezaWithId = updatePieza.bind(null, pieza.id);
  const deletePiezaWithId = deletePieza.bind(null, pieza.id);

  return (
    <div>
      <Link href="/admin/piezas" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Piezas
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">{pieza.nombre}</h1>
      <p className="mt-1 text-sm text-gris-500">Código {pieza.codigo}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Datos de la pieza</h2>
          <ActionForm action={updatePiezaWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">Nombre *</label>
              <input
                name="nombre"
                required
                defaultValue={pieza.nombre}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">Descripción</label>
              <textarea
                name="descripcion"
                rows={2}
                defaultValue={pieza.descripcion ?? ""}
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
                  defaultValue={pieza.unidadMedida}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
                <datalist id="unidades-medida">
                  {UNIDADES_MEDIDA_SUGERIDAS.map((unidad) => (
                    <option key={unidad} value={unidad} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Stock</label>
                <input
                  name="stock"
                  type="number"
                  step="0.01"
                  defaultValue={pieza.stock}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>

            <ClaseCategoriaSelector
              clases={clases}
              categorias={categorias}
              claseIdInicial={pieza.claseId ?? ""}
              categoriaIdInicial={pieza.categoriaId ?? ""}
            />

            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar cambios
            </button>
          </ActionForm>

          <div className="mt-3">
            <ConfirmDeleteButton
              action={deletePiezaWithId}
              mensaje={`¿Eliminar la pieza "${pieza.nombre}"? Esta acción no se puede deshacer.`}
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar pieza
            </ConfirmDeleteButton>
          </div>
        </div>

        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Historial de uso</h2>
          <ul className="mt-4 divide-y divide-gris-100">
            {pieza.usos.map((uso) => (
              <li key={uso.id} className="py-3">
                <Link
                  href={`/admin/ordenes-trabajo/${uso.tarea.ordenTrabajoId}`}
                  className="font-medium text-celeste-700 hover:underline"
                >
                  {uso.tarea.ordenTrabajo.codigo}
                </Link>
                <p className="text-xs text-gris-500">{uso.tarea.descripcion}</p>
                <p className="mt-1 text-sm text-gris-700">
                  {uso.cantidad} {pieza.unidadMedida} — {uso.createdAt.toLocaleDateString("es-AR")}
                </p>
              </li>
            ))}
            {pieza.usos.length === 0 && (
              <li className="py-3 text-sm text-gris-500">
                Todavía no se registró el uso de esta pieza en ninguna Tarea.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
