import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePropietario, deletePropietario } from "../actions";
import { createAeronave } from "../../aeronaves/actions";

export default async function PropietarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const propietario = await prisma.propietario.findUnique({
    where: { id },
    include: { aeronaves: { orderBy: { matricula: "asc" } } },
  });

  if (!propietario) notFound();

  const updatePropietarioWithId = updatePropietario.bind(null, propietario.id);
  const deletePropietarioWithId = deletePropietario.bind(null, propietario.id);

  return (
    <div>
      <Link
        href="/admin/propietarios"
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← Propietarios
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {propietario.nombre}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">
            Datos del propietario
          </h2>
          <form action={updatePropietarioWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Nombre / Razón social *
              </label>
              <input
                name="nombre"
                required
                defaultValue={propietario.nombre}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                DNI / CUIT
              </label>
              <input
                name="documento"
                defaultValue={propietario.documento ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Teléfono
              </label>
              <input
                name="telefono"
                defaultValue={propietario.telefono ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={propietario.email ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Dirección
              </label>
              <input
                name="direccion"
                defaultValue={propietario.direccion ?? ""}
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

          <form action={deletePropietarioWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar propietario
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Aeronaves</h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {propietario.aeronaves.map((aeronave) => (
                <li key={aeronave.id} className="py-3">
                  <Link
                    href={`/admin/aeronaves/${aeronave.id}`}
                    className="font-medium text-celeste-700 hover:underline"
                  >
                    {aeronave.matricula}
                  </Link>
                  <p className="text-xs text-gris-500">
                    {[aeronave.marca, aeronave.modelo]
                      .filter(Boolean)
                      .join(" ") || "Sin marca/modelo cargado"}
                  </p>
                </li>
              ))}
              {propietario.aeronaves.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Este propietario todavía no tiene aeronaves cargadas.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Agregar aeronave
            </h2>
            <form action={createAeronave} className="mt-4 space-y-3">
              <input type="hidden" name="propietarioId" value={propietario.id} />
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Matrícula *
                </label>
                <input
                  name="matricula"
                  required
                  placeholder="LV-ABC"
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
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Modelo
                  </label>
                  <input
                    name="modelo"
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
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-marron-600 py-2 text-sm font-medium text-white hover:bg-marron-700"
              >
                Agregar aeronave
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
