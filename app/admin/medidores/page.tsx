import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cargarMedidor } from "./actions";

export default async function CargaMedidoresPage({
  searchParams,
}: PageProps<"/admin/medidores">) {
  const { aeronaveId: aeronaveIdParam } = await searchParams;
  const aeronaveId = Array.isArray(aeronaveIdParam) ? aeronaveIdParam[0] : aeronaveIdParam;

  const aeronaves = await prisma.aeronave.findMany({
    orderBy: { matricula: "asc" },
  });

  const aeronave = aeronaveId
    ? await prisma.aeronave.findUnique({
        where: { id: aeronaveId },
        include: {
          activos: { orderBy: { tipo: "asc" } },
        },
      })
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Carga de Medidores</h1>
      <p className="mt-1 text-sm text-gris-500">
        Sumá las horas de vuelo y los ciclos realizados a una aeronave y a todos
        los activos montados en ella.
      </p>

      <div className="mt-8 max-w-xl">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Aeronave</h2>
          <form method="GET" className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gris-700">
                Seleccioná una aeronave
              </label>
              <select
                name="aeronaveId"
                defaultValue={aeronaveId ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              >
                <option value="" disabled>
                  Seleccioná una aeronave
                </option>
                {aeronaves.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.matricula}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md border border-celeste-700 px-4 py-2 text-sm font-medium text-celeste-700 hover:bg-celeste-50"
            >
              Ver
            </button>
          </form>
          {aeronaves.length === 0 && (
            <p className="mt-4 text-sm text-gris-500">
              Todavía no hay aeronaves cargadas.
            </p>
          )}
        </div>

        {aeronave && (
          <>
            <div className="mt-6 rounded-lg border border-gris-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gris-900">
                Datos de la aeronave
              </h2>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-gris-500">Fabricante</dt>
                  <dd className="text-gris-900">{aeronave.marca ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gris-500">Modelo</dt>
                  <dd className="text-gris-900">{aeronave.modelo ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gris-500">Matrícula</dt>
                  <dd className="text-gris-900">{aeronave.matricula}</dd>
                </div>
              </dl>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-gris-500">Horas TSN / TSO</dt>
                  <dd className="text-gris-900">
                    {aeronave.horasTSN ?? "—"} / {aeronave.horasTSO ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gris-500">Ciclos TSN / TSO</dt>
                  <dd className="text-gris-900">
                    {aeronave.ciclosTSN ?? "—"} / {aeronave.ciclosTSO ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 rounded-lg border border-gris-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gris-900">
                Cargar vuelo
              </h2>
              <p className="mt-1 text-xs text-gris-500">
                Lo que cargues acá se suma al total actual de la aeronave y de
                cada uno de sus {aeronave.activos.length} activo(s) montado(s),
                tanto en TSN como en TSO.
              </p>
              <form action={cargarMedidor} className="mt-4 space-y-3">
                <input type="hidden" name="aeronaveId" value={aeronave.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Horas de vuelo
                    </label>
                    <input
                      name="horas"
                      type="number"
                      step="0.1"
                      min="0"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Ciclos realizados
                    </label>
                    <input
                      name="ciclos"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
                >
                  Sumar a la aeronave y sus activos
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-lg border border-gris-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gris-900">
                Activos montados en {aeronave.matricula}
              </h2>
              <ul className="mt-4 divide-y divide-gris-100">
                {aeronave.activos.map((activo) => (
                  <li key={activo.id} className="py-3 text-sm">
                    <Link
                      href={`/admin/activos/${activo.id}`}
                      className="font-medium text-celeste-700 hover:underline"
                    >
                      {activo.tipo}
                    </Link>
                    <p className="text-xs text-gris-500">
                      Horas TSN/TSO: {activo.horasTSN ?? "—"} / {activo.horasTSO ?? "—"}
                      {" · "}
                      Ciclos TSN/TSO: {activo.ciclosTSN ?? "—"} / {activo.ciclosTSO ?? "—"}
                    </p>
                  </li>
                ))}
                {aeronave.activos.length === 0 && (
                  <li className="py-3 text-sm text-gris-500">
                    Esta aeronave todavía no tiene activos montados.
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
