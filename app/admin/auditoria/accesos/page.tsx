import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ACCION_BADGE_CLASS: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-700",
  LOGOUT: "bg-gris-200 text-gris-700",
};

export default async function AuditoriaAccesosPage() {
  const registros = await prisma.auditoriaAcceso.findMany({
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
        Ingresos y egresos de usuarios al sistema. Muestra los últimos 300 registros.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/auditoria" className={pill(false)}>
          Cambios de datos
        </Link>
        <Link href="/admin/auditoria/campos" className={pill(false)}>
          Campos auditados
        </Link>
        <Link href="/admin/auditoria/accesos" className={pill(true)}>
          Accesos
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-gris-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gris-100">
            {registros.map((registro) => (
              <tr key={registro.id} className="hover:bg-gris-50">
                <td className="px-4 py-3 whitespace-nowrap text-gris-500">
                  {registro.fecha.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 text-gris-900">{registro.usuario ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACCION_BADGE_CLASS[registro.accion] ?? "bg-gris-100 text-gris-700"}`}
                  >
                    {registro.accion}
                  </span>
                </td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gris-500">
                  Todavía no hay accesos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
