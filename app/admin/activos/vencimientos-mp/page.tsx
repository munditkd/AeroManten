import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  calcularVencimiento,
  formatFactor,
  ESTADO_LABEL,
  ESTADO_BADGE_CLASS,
} from "@/lib/mantenimiento-preventivo";

export default async function VencimientosMPPage() {
  const relaciones = await prisma.activoMantenimientoPreventivo.findMany({
    include: {
      activo: { include: { aeronave: true } },
      aeronave: true,
      mantenimientoPreventivo: true,
      realizaciones: { orderBy: { fecha: "desc" }, take: 1 },
    },
  });

  const filas = relaciones
    .map((relacion) => {
      const esAeronave = Boolean(relacion.aeronave);
      const horas = esAeronave ? relacion.aeronave!.horasTSN : relacion.activo?.horasTSN ?? null;
      const ciclos = esAeronave ? relacion.aeronave!.ciclosTSN : relacion.activo?.ciclosTSN ?? null;
      const ultima = relacion.realizaciones[0] ?? null;
      const venc = calcularVencimiento({
        mp: relacion.mantenimientoPreventivo,
        activoHoras: horas,
        activoCiclos: ciclos,
        ultimaRealizacion: ultima
          ? { fecha: ultima.fecha, horas: ultima.horas, ciclos: ultima.ciclos }
          : null,
      });
      const matricula = relacion.aeronave?.matricula ?? relacion.activo?.aeronave?.matricula;
      return { relacion, ultima, venc, esAeronave, matricula };
    })
    .sort((a, b) => b.venc.criticidad - a.venc.criticidad);

  return (
    <div>
      <Link
        href="/admin/activos"
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← Activos
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        Listado de MP con Vencimiento
      </h1>
      <p className="mt-1 text-sm text-gris-500">
        Todos los mantenimientos preventivos relacionados con activos o aeronaves,
        ordenados del primero a vencer hasta el último.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-gris-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
            <tr>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">MP</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Aeronave</th>
              <th className="px-4 py-3">Última realización</th>
              <th className="px-4 py-3">Factor crítico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gris-100">
            {filas.map(({ relacion, ultima, venc, esAeronave, matricula }) => (
              <tr key={relacion.id} className="hover:bg-gris-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE_CLASS[venc.estado]}`}
                  >
                    {ESTADO_LABEL[venc.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/admin/activos/relacionar-mp/${relacion.id}`}
                    className="font-medium text-celeste-700 hover:underline"
                  >
                    {relacion.mantenimientoPreventivo.codigo}
                  </Link>
                  <p className="text-xs text-gris-500">
                    {relacion.mantenimientoPreventivo.descripcion}
                  </p>
                </td>
                <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                  {esAeronave ? "Aeronave completa" : relacion.activo?.tipo}
                  <p className="text-xs text-gris-500">
                    {esAeronave
                      ? relacion.aeronave?.matricula
                      : relacion.activo?.numeroSerie ?? "Sin N/S"}
                  </p>
                </td>
                <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                  {matricula ?? "En depósito"}
                </td>
                <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                  {ultima ? ultima.fecha.toLocaleDateString("es-AR") : "Nunca"}
                </td>
                <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                  {venc.factorCritico
                    ? `${venc.factorCritico.tipo}: ${formatFactor(venc.factorCritico)}`
                    : "—"}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gris-500">
                  Todavía no hay activos ni aeronaves relacionados con MP.{" "}
                  <Link
                    href="/admin/activos/relacionar-mp"
                    className="text-celeste-700 hover:underline"
                  >
                    Relacionar ahora
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
