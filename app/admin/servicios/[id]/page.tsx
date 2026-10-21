import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateServicio, deleteServicio } from "../actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";

const UNIDADES_MEDIDA_SUGERIDAS = ["Hora", "Mes", "Visita", "Servicio", "Unidad"];

export default async function ServicioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [servicio, clases, categorias] = await Promise.all([
    prisma.servicio.findUnique({ where: { id } }),
    obtenerClases("Servicio"),
    obtenerCategoriasDeEntidad("Servicio"),
  ]);

  if (!servicio) notFound();

  const updateServicioWithId = updateServicio.bind(null, servicio.id);
  const deleteServicioWithId = deleteServicio.bind(null, servicio.id);

  return (
    <div>
      <Link href="/admin/servicios" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Servicios
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">{servicio.nombre}</h1>

      <div className="mt-8 max-w-xl">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Datos del servicio</h2>
          <ActionForm action={updateServicioWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">Nombre *</label>
              <input
                name="nombre"
                required
                defaultValue={servicio.nombre}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">Descripción</label>
              <textarea
                name="descripcion"
                rows={2}
                defaultValue={servicio.descripcion ?? ""}
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
                defaultValue={servicio.unidadMedida}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
              <datalist id="unidades-medida-servicio">
                {UNIDADES_MEDIDA_SUGERIDAS.map((unidad) => (
                  <option key={unidad} value={unidad} />
                ))}
              </datalist>
            </div>

            <ClaseCategoriaSelector
              clases={clases}
              categorias={categorias}
              claseIdInicial={servicio.claseId ?? ""}
              categoriaIdInicial={servicio.categoriaId ?? ""}
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
              action={deleteServicioWithId}
              mensaje={`¿Eliminar el servicio "${servicio.nombre}"? Esta acción no se puede deshacer.`}
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar servicio
            </ConfirmDeleteButton>
          </div>
        </div>
      </div>
    </div>
  );
}
