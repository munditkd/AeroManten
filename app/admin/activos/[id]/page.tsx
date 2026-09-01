import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateActivo, deleteActivo } from "../actions";
import { createMantenimiento, deleteMantenimiento } from "../../aeronaves/actions";

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

const TIPOS_ACTIVO_SUGERIDOS = [
  "Motor",
  "Hélice",
  "Transponder",
  "Tren de aterrizaje",
  "Batería",
  "Instrumento",
];

export default async function ActivoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const activo = await prisma.activo.findUnique({
    where: { id },
    include: {
      aeronave: true,
      mantenimientos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!activo) notFound();

  const updateActivoWithId = updateActivo.bind(null, activo.id);
  const deleteActivoWithId = deleteActivo.bind(null, activo.id);

  return (
    <div>
      <Link
        href={`/admin/aeronaves/${activo.aeronaveId}`}
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← {activo.aeronave.matricula}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {activo.tipo}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">
            Datos del componente
          </h2>
          <form action={updateActivoWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Tipo *
              </label>
              <input
                name="tipo"
                required
                list="tipos-activo"
                defaultValue={activo.tipo}
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
                  defaultValue={activo.marca ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Modelo
                </label>
                <input
                  name="modelo"
                  defaultValue={activo.modelo ?? ""}
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
                defaultValue={activo.numeroSerie ?? ""}
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
                defaultValue={toDateInput(activo.fechaFabricacion)}
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
                  defaultValue={activo.horasTSN ?? ""}
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
                  defaultValue={activo.horasTSO ?? ""}
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
                  defaultValue={activo.ciclosTSN ?? ""}
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
                  defaultValue={activo.ciclosTSO ?? ""}
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

          <form action={deleteActivoWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar componente
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Historial de mantenimiento
            </h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {activo.mantenimientos.map((registro) => (
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
              {activo.mantenimientos.length === 0 && (
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
              <input type="hidden" name="aeronaveId" value={activo.aeronaveId} />
              <input type="hidden" name="activoId" value={activo.id} />
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
