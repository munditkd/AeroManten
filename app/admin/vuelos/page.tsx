import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cargarVuelo } from "./actions";

export default async function CargaVuelosPage({
  searchParams,
}: PageProps<"/admin/vuelos">) {
  const { aeronaveId: aeronaveIdParam } = await searchParams;
  const aeronaveId = Array.isArray(aeronaveIdParam) ? aeronaveIdParam[0] : aeronaveIdParam;

  const [aeronaves, pilotos] = await Promise.all([
    prisma.aeronave.findMany({
      orderBy: { matricula: "asc" },
    }),
    prisma.personal.findMany({
      where: { rol: "PILOTO" },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
  ]);

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
      <h1 className="text-2xl font-semibold text-gris-900">Carga de Vuelos</h1>
      <p className="mt-1 text-sm text-gris-500">
        Registrá los datos del vuelo y sumá las horas y los ciclos realizados a
        una aeronave y a todos los activos montados en ella.
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
                Las horas y ciclos que cargues acá se suman al total actual de
                la aeronave y de cada uno de sus {aeronave.activos.length}{" "}
                activo(s) montado(s), tanto en TSN como en TSO.
              </p>
              <form action={cargarVuelo} className="mt-4 space-y-3">
                <input type="hidden" name="aeronaveId" value={aeronave.id} />

                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Piloto
                  </label>
                  <select
                    name="pilotoId"
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    <option value="">Sin especificar</option>
                    {pilotos.map((piloto) => (
                      <option key={piloto.id} value={piloto.id}>
                        {piloto.apellido}, {piloto.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-gris-100 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      País origen
                    </label>
                    <input
                      name="paisOrigen"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Aeropuerto origen
                    </label>
                    <input
                      name="aeropuertoOrigen"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Fecha origen
                    </label>
                    <input
                      name="fechaOrigen"
                      type="date"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Hora origen
                    </label>
                    <input
                      name="horaOrigen"
                      type="time"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-gris-100 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      País destino
                    </label>
                    <input
                      name="paisDestino"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Aeropuerto destino
                    </label>
                    <input
                      name="aeropuertoDestino"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Fecha destino
                    </label>
                    <input
                      name="fechaDestino"
                      type="date"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Hora destino
                    </label>
                    <input
                      name="horaDestino"
                      type="time"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-gris-100 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gris-700">
                      Tiempo de vuelo (horas)
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
                      Ciclos
                    </label>
                    <input
                      name="ciclos"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    rows={2}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
                >
                  Registrar vuelo
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
