import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createAeronave } from "./actions";

export default async function AeronavesPage() {
  const [aeronaves, propietarios] = await Promise.all([
    prisma.aeronave.findMany({
      orderBy: { matricula: "asc" },
      include: { propietario: true, _count: { select: { activos: true } } },
    }),
    prisma.propietario.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Aeronaves</h1>
      <p className="mt-1 text-sm text-gris-500">
        Todas las aeronaves cargadas, con sus propietarios.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Matrícula</th>
                  <th className="px-4 py-3">Fabricante / N° de Parte</th>
                  <th className="px-4 py-3">N° de serie</th>
                  <th className="px-4 py-3">Fabricación</th>
                  <th className="px-4 py-3">Horas TSN / TSO</th>
                  <th className="px-4 py-3">Ciclos TSN / TSO</th>
                  <th className="px-4 py-3">Meses TSN / TSO</th>
                  <th className="px-4 py-3">Propietario</th>
                  <th className="px-4 py-3">Componentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {aeronaves.map((aeronave) => (
                  <tr key={aeronave.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/aeronaves/${aeronave.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {aeronave.matricula}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {[aeronave.marca, aeronave.modelo].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {aeronave.numeroSerie ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {aeronave.fechaFabricacion
                        ? aeronave.fechaFabricacion.toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {aeronave.horasTSN ?? "—"} / {aeronave.horasTSO ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {aeronave.ciclosTSN ?? "—"} / {aeronave.ciclosTSO ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {aeronave.mesesTSN ?? "—"} / {aeronave.mesesTSO ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      <Link
                        href={`/admin/propietarios/${aeronave.propietarioId}`}
                        className="hover:underline"
                      >
                        {aeronave.propietario.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {aeronave._count.activos}
                    </td>
                  </tr>
                ))}
                {aeronaves.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-gris-500"
                    >
                      Todavía no hay aeronaves cargadas.
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
              Nueva aeronave
            </h2>
            {propietarios.length === 0 ? (
              <p className="mt-4 text-sm text-gris-500">
                Primero tenés que{" "}
                <Link
                  href="/admin/propietarios"
                  className="text-celeste-700 hover:underline"
                >
                  crear un propietario
                </Link>
                .
              </p>
            ) : (
              <form action={createAeronave} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Propietario *
                  </label>
                  <select
                    name="propietarioId"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    <option value="" disabled>
                      Seleccioná un propietario
                    </option>
                    {propietarios.map((propietario) => (
                      <option key={propietario.id} value={propietario.id}>
                        {propietario.nombre}
                      </option>
                    ))}
                  </select>
                </div>
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
                      Fabricante
                    </label>
                    <input
                      name="marca"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Número de Parte
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
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Fecha de fabricación
                  </label>
                  <input
                    name="fechaFabricacion"
                    type="date"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Horas TSN
                    </label>
                    <input
                      name="horasTSN"
                      type="number"
                      step="0.1"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Horas TSO
                    </label>
                    <input
                      name="horasTSO"
                      type="number"
                      step="0.1"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Ciclos TSN
                    </label>
                    <input
                      name="ciclosTSN"
                      type="number"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Ciclos TSO
                    </label>
                    <input
                      name="ciclosTSO"
                      type="number"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Meses TSN
                    </label>
                    <input
                      name="mesesTSN"
                      type="number"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Meses TSO
                    </label>
                    <input
                      name="mesesTSO"
                      type="number"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
                >
                  Crear aeronave
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
