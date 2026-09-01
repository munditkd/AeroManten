import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  updateAeronave,
  deleteAeronave,
  createMantenimiento,
  deleteMantenimiento,
} from "../actions";

export default async function AeronaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const aeronave = await prisma.aeronave.findUnique({
    where: { id },
    include: {
      propietario: true,
      mantenimientos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!aeronave) notFound();

  const updateAeronaveWithId = updateAeronave.bind(null, aeronave.id);
  const deleteAeronaveWithId = deleteAeronave.bind(null, aeronave.id);

  return (
    <div>
      <Link
        href={`/admin/propietarios/${aeronave.propietarioId}`}
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← {aeronave.propietario.nombre}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {aeronave.matricula}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">
            Datos de la aeronave
          </h2>
          <form action={updateAeronaveWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Matrícula *
              </label>
              <input
                name="matricula"
                required
                defaultValue={aeronave.matricula}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm uppercase focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Marca
                </label>
                <input
                  name="marca"
                  defaultValue={aeronave.marca ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Modelo
                </label>
                <input
                  name="modelo"
                  defaultValue={aeronave.modelo ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Número de serie
              </label>
              <input
                name="numeroSerie"
                defaultValue={aeronave.numeroSerie ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar cambios
            </button>
          </form>

          <form action={deleteAeronaveWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar aeronave
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Historial de mantenimiento
            </h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {aeronave.mantenimientos.map((registro) => (
                <li
                  key={registro.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm text-gris-900">
                      {registro.descripcion}
                    </p>
                    <p className="text-xs text-gris-500">
                      {registro.fecha.toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <form action={deleteMantenimiento.bind(null, registro.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </form>
                </li>
              ))}
              {aeronave.mantenimientos.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Todavía no hay registros de mantenimiento.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Agregar registro
            </h2>
            <form action={createMantenimiento} className="mt-4 space-y-3">
              <input type="hidden" name="aeronaveId" value={aeronave.id} />
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Fecha *
                </label>
                <input
                  name="fecha"
                  type="date"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Descripción *
                </label>
                <textarea
                  name="descripcion"
                  required
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-marron-600 py-2 text-sm font-medium text-white hover:bg-marron-700"
              >
                Agregar registro
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
