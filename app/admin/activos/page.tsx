import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createActivo } from "./actions";

const TIPOS_ACTIVO_SUGERIDOS = [
  "Motor",
  "Hélice",
  "Transponder",
  "Tren de aterrizaje",
  "Batería",
  "Instrumento",
];

export default async function ActivosPage() {
  const [activos, aeronaves] = await Promise.all([
    prisma.activo.findMany({
      orderBy: [{ aeronave: { matricula: "asc" } }, { tipo: "asc" }],
      include: { aeronave: true },
    }),
    prisma.aeronave.findMany({ orderBy: { matricula: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Activos</h1>
      <p className="mt-1 text-sm text-gris-500">
        Componentes de las aeronaves: motores, hélices, transponders, etc.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Marca / Modelo</th>
                  <th className="px-4 py-3">Aeronave</th>
                  <th className="px-4 py-3">Horas TSN / TSO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {activos.map((activo) => (
                  <tr key={activo.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/activos/${activo.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {activo.tipo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600">
                      {[activo.marca, activo.modelo].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600">
                      <Link
                        href={`/admin/aeronaves/${activo.aeronaveId}`}
                        className="hover:underline"
                      >
                        {activo.aeronave.matricula}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600">
                      {activo.horasTSN ?? "—"} / {activo.horasTSO ?? "—"}
                    </td>
                  </tr>
                ))}
                {activos.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-gris-500"
                    >
                      Todavía no hay componentes cargados.
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
              Nuevo componente
            </h2>
            {aeronaves.length === 0 ? (
              <p className="mt-4 text-sm text-gris-500">
                Primero tenés que{" "}
                <Link
                  href="/admin/aeronaves"
                  className="text-celeste-700 hover:underline"
                >
                  crear una aeronave
                </Link>
                .
              </p>
            ) : (
              <form action={createActivo} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Aeronave *
                  </label>
                  <select
                    name="aeronaveId"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    <option value="" disabled>
                      Seleccioná una aeronave
                    </option>
                    {aeronaves.map((aeronave) => (
                      <option key={aeronave.id} value={aeronave.id}>
                        {aeronave.matricula}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Tipo *
                  </label>
                  <input
                    name="tipo"
                    required
                    list="tipos-activo"
                    placeholder="Motor, hélice, transponder..."
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                  <datalist id="tipos-activo">
                    {TIPOS_ACTIVO_SUGERIDOS.map((tipo) => (
                      <option key={tipo} value={tipo} />
                    ))}
                  </datalist>
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
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
                >
                  Crear componente
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
