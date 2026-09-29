import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obtenerTablaAuditable, obtenerCampoAuditable } from "@/lib/auditoria-config";

const ACCION_BADGE_CLASS: Record<string, string> = {
  INSERT: "bg-green-100 text-green-700",
  UPDATE: "bg-celeste-100 text-celeste-700",
  DELETE: "bg-red-100 text-red-700",
};

export default async function AuditoriaPage() {
  const registros = await prisma.auditoria.findMany({
    orderBy: { fecha: "desc" },
    take: 300,
  });

  const pill = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? "border-celeste-700 bg-celeste-700 text-white"
        : "border-gris-300 text-gris-700 hover:bg-gris-50"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Auditoría</h1>
      <p className="mt-1 text-sm text-gris-500">
        Historial de cambios en los campos marcados para auditar. Muestra los últimos 300
        registros.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/auditoria" className={pill(true)}>
          Cambios de datos
        </Link>
        <Link href="/admin/auditoria/campos" className={pill(false)}>
          Campos auditados
        </Link>
        <Link href="/admin/auditoria/accesos" className={pill(false)}>
          Accesos
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-gris-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tabla</th>
              <th className="px-4 py-3">Campo</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Valor anterior</th>
              <th className="px-4 py-3">Valor nuevo</th>
              <th className="px-4 py-3">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gris-100">
            {registros.map((registro) => {
              const tablaInfo = obtenerTablaAuditable(registro.tabla);
              const campoInfo = obtenerCampoAuditable(registro.tabla, registro.campo);
              return (
                <tr key={registro.id} className="hover:bg-gris-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gris-500">
                    {registro.fecha.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gris-900">
                    {tablaInfo?.label ?? registro.tabla}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gris-600">
                    {campoInfo?.label ?? registro.campo}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACCION_BADGE_CLASS[registro.accion] ?? "bg-gris-100 text-gris-700"}`}
                    >
                      {registro.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gris-600">{registro.valorAnterior ?? "—"}</td>
                  <td className="px-4 py-3 text-gris-600">{registro.valorNuevo ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gris-500">
                    {registro.usuario ?? "—"}
                  </td>
                </tr>
              );
            })}
            {registros.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gris-500">
                  Todavía no hay cambios registrados. Configurá qué campos auditar en{" "}
                  <Link href="/admin/auditoria/campos" className="text-celeste-700 hover:underline">
                    Campos auditados
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
