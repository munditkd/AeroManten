import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateMantenimientoPreventivo, deleteMantenimientoPreventivo } from "../actions";

export default async function MantenimientoPreventivoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.mantenimientoPreventivo.findUnique({
    where: { id },
  });

  if (!item) notFound();

  const updateWithId = updateMantenimientoPreventivo.bind(null, item.id);
  const deleteWithId = deleteMantenimientoPreventivo.bind(null, item.id);

  return (
    <div>
      <Link
        href="/admin/mantenimiento-preventivo"
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← Mantenimiento Preventivo
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {item.codigo}
      </h1>

      <div className="mt-8 max-w-xl">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">
            Datos de la tarea
          </h2>
          <form action={updateWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Código *
              </label>
              <input
                name="codigo"
                required
                defaultValue={item.codigo}
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
                defaultValue={item.descripcion}
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
                  defaultValue={item.horas ?? ""}
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
                  defaultValue={item.ciclos ?? ""}
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
                  defaultValue={item.meses ?? ""}
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
                defaultValue={item.tarea}
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
                  defaultValue={item.personas ?? ""}
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
                  defaultValue={item.horasHombre ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar cambios
            </button>
          </form>

          <form action={deleteWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar tarea
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
