import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPropietario } from "./actions";

export default async function PropietariosPage() {
  const propietarios = await prisma.propietario.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { aeronaves: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Propietarios</h1>
      <p className="mt-1 text-sm text-gris-500">
        Personas o empresas propietarias de aeronaves.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Aeronaves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {propietarios.map((propietario) => (
                  <tr key={propietario.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/propietarios/${propietario.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {propietario.nombre}
                      </Link>
                      {propietario.documento && (
                        <p className="text-xs text-gris-500">
                          {propietario.documento}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gris-600">
                      {propietario.telefono || propietario.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600">
                      {propietario._count.aeronaves}
                    </td>
                  </tr>
                ))}
                {propietarios.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-gris-500"
                    >
                      Todavía no hay propietarios cargados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Nuevo propietario
            </h2>
            <form action={createPropietario} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Nombre / Razón social *
                </label>
                <input
                  name="nombre"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  DNI / CUIT
                </label>
                <input
                  name="documento"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Teléfono
                </label>
                <input
                  name="telefono"
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
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Dirección
                </label>
                <input
                  name="direccion"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear propietario
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
