import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";
import { TABLAS_AUDITABLES, obtenerTablaAuditable, obtenerCampoAuditable } from "@/lib/auditoria-config";
import { createCampoAuditado, deleteCampoAuditado } from "./actions";
import { CampoSelector } from "./campo-selector";

export default async function CamposAuditadosPage() {
  const camposAuditados = await prisma.campoAuditado.findMany({
    orderBy: { createdAt: "asc" },
  });

  const pill = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? "border-celeste-700 bg-celeste-700 text-white"
        : "border-gris-300 text-gris-700 hover:bg-gris-50"
    }`;

  return (
    <div>
      <Link href="/admin/auditoria" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Auditoría
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">Campos auditados</h1>
      <p className="mt-1 text-sm text-gris-500">
        Solo los campos que están en esta lista generan registros en Auditoría. Sacar uno de acá
        no borra el historial ya generado, solo deja de agregar filas nuevas.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/auditoria" className={pill(false)}>
          Cambios de datos
        </Link>
        <Link href="/admin/auditoria/campos" className={pill(true)}>
          Campos auditados
        </Link>
        <Link href="/admin/auditoria/accesos" className={pill(false)}>
          Accesos
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
              <tr>
                <th className="px-4 py-3">Tabla</th>
                <th className="px-4 py-3">Campo</th>
                <th className="px-4 py-3">Desde</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gris-100">
              {camposAuditados.map((fila) => {
                const tablaInfo = obtenerTablaAuditable(fila.tabla);
                const campoInfo = obtenerCampoAuditable(fila.tabla, fila.campo);
                const deleteWithId = deleteCampoAuditado.bind(null, fila.id);
                return (
                  <tr key={fila.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3 text-gris-900">{tablaInfo?.label ?? fila.tabla}</td>
                    <td className="px-4 py-3 text-gris-600">{campoInfo?.label ?? fila.campo}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gris-500">
                      {fila.createdAt.toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ConfirmDeleteButton
                        action={deleteWithId}
                        mensaje={`¿Sacar "${campoInfo?.label ?? fila.campo}" de ${tablaInfo?.label ?? fila.tabla} de la auditoría? Los cambios futuros en ese campo van a dejar de registrarse.`}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Eliminar
                      </ConfirmDeleteButton>
                    </td>
                  </tr>
                );
              })}
              {camposAuditados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gris-500">
                    Todavía no hay campos configurados para auditar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Agregar campo a auditar</h2>
            <ActionForm action={createCampoAuditado} className="mt-4 space-y-3">
              <CampoSelector tablas={TABLAS_AUDITABLES} />
              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Agregar a la auditoría
              </button>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
