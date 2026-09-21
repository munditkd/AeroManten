import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ROL_LABEL, ROLES_PERSONAL } from "@/lib/personal";
import { createPersonal } from "./actions";

export default async function PersonalPage() {
  const personal = await prisma.personal.findMany({
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Personal</h1>
      <p className="mt-1 text-sm text-gris-500">
        Datos del personal de la empresa: pilotos, mecánicos, operarios y
        administrativos, junto con su habilitación vigente.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
              <tr>
                <th className="px-4 py-3">Apellido y nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Habilitado</th>
                <th className="px-4 py-3">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gris-100">
              {personal.map((persona) => (
                <tr key={persona.id} className="hover:bg-gris-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/personal/${persona.id}`}
                      className="font-medium text-celeste-700 hover:underline"
                    >
                      {persona.apellido}, {persona.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {ROL_LABEL[persona.rol]}
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {persona.dni ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        persona.habilitado
                          ? "bg-green-100 text-green-700"
                          : "bg-gris-100 text-gris-600"
                      }`}
                    >
                      {persona.habilitado ? "Habilitado" : "No habilitado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {persona.fechaVencimientoHabilitacion
                      ? persona.fechaVencimientoHabilitacion.toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                </tr>
              ))}
              {personal.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gris-500">
                    Todavía no hay personal cargado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nueva persona</h2>
            <form action={createPersonal} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Nombre *
                  </label>
                  <input
                    name="nombre"
                    required
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Apellido *
                  </label>
                  <input
                    name="apellido"
                    required
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Rol *
                </label>
                <select
                  name="rol"
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="" disabled>
                    Seleccioná un rol
                  </option>
                  {ROLES_PERSONAL.map((rol) => (
                    <option key={rol} value={rol}>
                      {ROL_LABEL[rol]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    DNI
                  </label>
                  <input
                    name="dni"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Legajo
                  </label>
                  <input
                    name="legajo"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
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
                  Fecha de nacimiento
                </label>
                <input
                  name="fechaNacimiento"
                  type="date"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <div className="border-t border-gris-100 pt-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gris-700">
                  <input name="habilitado" type="checkbox" className="rounded border-gris-300" />
                  Habilitado
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Inicio habilitación
                  </label>
                  <input
                    name="fechaInicioHabilitacion"
                    type="date"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Vencimiento
                  </label>
                  <input
                    name="fechaVencimientoHabilitacion"
                    type="date"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear persona
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
