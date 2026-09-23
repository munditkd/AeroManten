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
        Componentes de las aeronaves: motores, hélices, transponders, etc. Un activo
        puede estar montado en una aeronave o en depósito como repuesto.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <Link
            href="/admin/activos/relacionar-mp"
            className="block rounded-lg border border-gris-200 bg-white p-4 text-sm font-medium text-celeste-700 hover:bg-celeste-50"
          >
            Relacionar Activos/Aeronaves con MP
          </Link>
          <Link
            href="/admin/activos/vencimientos-mp"
            className="block rounded-lg border border-gris-200 bg-white p-4 text-sm font-medium text-celeste-700 hover:bg-celeste-50"
          >
            Listado de MP con Vencimiento
          </Link>
        </div>

        <div>
          <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Fabricante / N° de Parte</th>
                  <th className="px-4 py-3">N° de serie</th>
                  <th className="px-4 py-3">Fabricación</th>
                  <th className="px-4 py-3">Horas TSN / TSO</th>
                  <th className="px-4 py-3">Ciclos TSN / TSO</th>
                  <th className="px-4 py-3">Meses TSN / TSO</th>
                  <th className="px-4 py-3">Aeronave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {activos.map((activo) => (
                  <tr key={activo.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {activo.codigo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/activos/${activo.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {activo.tipo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {[activo.marca, activo.modelo].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {activo.numeroSerie ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {activo.fechaFabricacion
                        ? activo.fechaFabricacion.toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {activo.horasTSN ?? "—"} / {activo.horasTSO ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {activo.ciclosTSN ?? "—"} / {activo.ciclosTSO ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {activo.mesesTSN ?? "—"} / {activo.mesesTSO ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {activo.aeronave ? (
                        <Link
                          href={`/admin/aeronaves/${activo.aeronaveId}`}
                          className="hover:underline"
                        >
                          {activo.aeronave.matricula}
                        </Link>
                      ) : (
                        <span className="rounded-full bg-gris-100 px-2 py-0.5 text-xs text-gris-600">
                          En depósito
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {activos.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
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
            <form action={createActivo} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Aeronave
                  </label>
                  <select
                    name="aeronaveId"
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    <option value="">Sin aeronave (en depósito)</option>
                    {aeronaves.map((aeronave) => (
                      <option key={aeronave.id} value={aeronave.id}>
                        {aeronave.matricula}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gris-400">
                    Dejalo vacío si el componente está en depósito como repuesto.
                  </p>
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
                  Crear componente
                </button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
}
