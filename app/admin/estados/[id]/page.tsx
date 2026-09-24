import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TABLAS_ESTADO, RSTATUS_OPCIONES } from "@/lib/estados";
import { updateEstado, deleteEstado } from "../actions";

export default async function EstadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const estado = await prisma.estado.findUnique({ where: { id } });
  if (!estado) notFound();

  const updateEstadoWithId = updateEstado.bind(null, estado.id);
  const deleteEstadoWithId = deleteEstado.bind(null, estado.id);

  return (
    <div>
      <Link href="/admin/estados" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Estados
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">{estado.status}</h1>
      <p className="mt-1 text-sm text-gris-500">
        {estado.tabla} / {estado.propiedad}
      </p>

      <div className="mt-8 max-w-md rounded-lg border border-gris-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gris-900">Datos del estado</h2>
        <form action={updateEstadoWithId} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gris-700">Tabla *</label>
            <select
              name="tabla"
              required
              defaultValue={estado.tabla}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            >
              {TABLAS_ESTADO.map((tabla) => (
                <option key={tabla} value={tabla}>
                  {tabla}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">Propiedad *</label>
            <input
              name="propiedad"
              required
              defaultValue={estado.propiedad}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">Status *</label>
            <input
              name="status"
              required
              defaultValue={estado.status}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">RSTATUS *</label>
            <select
              name="rstatus"
              required
              defaultValue={estado.rstatus}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            >
              {RSTATUS_OPCIONES.map((rstatus) => (
                <option key={rstatus} value={rstatus}>
                  {rstatus}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gris-700">
            <input
              name="noUsar"
              type="checkbox"
              defaultChecked={estado.noUsar}
              className="rounded border-gris-300"
            />
            No usar
          </label>
          <p className="text-xs text-gris-400">
            Marcá esto para sacarlo de los desplegables sin borrar el
            historial que ya lo usa.
          </p>
          <button
            type="submit"
            className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
          >
            Guardar cambios
          </button>
        </form>

        <form action={deleteEstadoWithId} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar estado
          </button>
        </form>
      </div>
    </div>
  );
}
