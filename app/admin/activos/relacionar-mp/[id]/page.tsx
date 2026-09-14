import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  calcularVencimiento,
  formatFactor,
  ESTADO_LABEL,
  ESTADO_BADGE_CLASS,
} from "@/lib/mantenimiento-preventivo";
import { createRealizacion, deleteRealizacion, deleteRelacion } from "../actions";

export default async function RelacionMPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const relacion = await prisma.activoMantenimientoPreventivo.findUnique({
    where: { id },
    include: {
      activo: { include: { aeronave: true } },
      aeronave: true,
      mantenimientoPreventivo: true,
      realizaciones: { orderBy: { fecha: "desc" } },
    },
  });

  if (!relacion) notFound();

  const esAeronave = Boolean(relacion.aeronave);
  const horasActuales = esAeronave ? relacion.aeronave!.horasTSN : relacion.activo?.horasTSN ?? null;
  const ciclosActuales = esAeronave ? relacion.aeronave!.ciclosTSN : relacion.activo?.ciclosTSN ?? null;

  const ultima = relacion.realizaciones[0] ?? null;
  const venc = calcularVencimiento({
    mp: relacion.mantenimientoPreventivo,
    activoHoras: horasActuales,
    activoCiclos: ciclosActuales,
    ultimaRealizacion: ultima
      ? { fecha: ultima.fecha, horas: ultima.horas, ciclos: ultima.ciclos }
      : null,
  });

  const createRealizacionWithId = createRealizacion.bind(null, relacion.id);
  const deleteRelacionWithId = deleteRelacion.bind(null, relacion.id);

  return (
    <div>
      <Link
        href="/admin/activos/relacionar-mp"
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← Relacionar Activos/Aeronaves con MP
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {relacion.mantenimientoPreventivo.codigo} ·{" "}
        {esAeronave ? "Aeronave completa" : relacion.activo?.tipo}
      </h1>
      <p className="mt-1 text-sm text-gris-500">
        {esAeronave
          ? relacion.aeronave!.matricula
          : `${relacion.activo?.numeroSerie ?? "Sin N/S"} — ${relacion.activo?.aeronave?.matricula ?? "En depósito"}`}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Datos del MP
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-gris-500">Descripción</dt>
                <dd className="text-gris-900">
                  {relacion.mantenimientoPreventivo.descripcion}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gris-500">Intervalo horas</dt>
                <dd className="text-gris-900">
                  {relacion.mantenimientoPreventivo.horas ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gris-500">Intervalo ciclos</dt>
                <dd className="text-gris-900">
                  {relacion.mantenimientoPreventivo.ciclos ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gris-500">Intervalo meses</dt>
                <dd className="text-gris-900">
                  {relacion.mantenimientoPreventivo.meses ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-gris-500">Tarea</dt>
                <dd className="whitespace-pre-wrap text-gris-900">
                  {relacion.mantenimientoPreventivo.tarea}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Estado de vencimiento
            </h2>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE_CLASS[venc.estado]}`}
            >
              {ESTADO_LABEL[venc.estado]}
            </span>
            {venc.factores.length > 0 ? (
              <ul className="mt-4 space-y-1 text-sm text-gris-600">
                {venc.factores.map((factor) => (
                  <li key={factor.tipo}>
                    <span className="capitalize">{factor.tipo}:</span>{" "}
                    {formatFactor(factor)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gris-500">
                {venc.estado === "nunca-realizado"
                  ? `Todavía no se registró ninguna realización de este MP para ${esAeronave ? "esta aeronave" : "este activo"}.`
                  : `El MP no tiene intervalos de horas, ciclos o meses cargados, o a ${esAeronave ? "la aeronave" : "el activo"} le falta el dato de horas/ciclos actuales.`}
              </p>
            )}
            <p className="mt-4 text-xs text-gris-400">
              Horas/ciclos actuales {esAeronave ? "de la aeronave" : "del activo"} (TSN):{" "}
              {horasActuales ?? "—"} h / {ciclosActuales ?? "—"} cy
            </p>
          </div>

          <form action={deleteRelacionWithId}>
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar relación
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Historial de realizaciones
            </h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {relacion.realizaciones.map((realizado) => (
                <li key={realizado.id} className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gris-900">
                        {realizado.fecha.toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-xs text-gris-500">
                        {realizado.horas != null ? `${realizado.horas} h` : "— h"} /{" "}
                        {realizado.ciclos != null ? `${realizado.ciclos} cy` : "— cy"}
                      </p>
                      {realizado.observaciones && (
                        <p className="mt-1 text-xs text-gris-600">
                          {realizado.observaciones}
                        </p>
                      )}
                    </div>
                    <form action={deleteRealizacion.bind(null, realizado.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </li>
              ))}
              {relacion.realizaciones.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Todavía no hay realizaciones registradas.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Registrar realización
            </h2>
            <form action={createRealizacionWithId} className="mt-4 space-y-3">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Horas {esAeronave ? "de la aeronave" : "del activo"}
                  </label>
                  <input
                    name="horas"
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Ciclos {esAeronave ? "de la aeronave" : "del activo"}
                  </label>
                  <input
                    name="ciclos"
                    type="number"
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
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-marron-600 py-2 text-sm font-medium text-white hover:bg-marron-700"
              >
                Registrar realización
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
