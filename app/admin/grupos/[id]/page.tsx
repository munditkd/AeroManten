import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateGrupo, deleteGrupo } from "../actions";

export default async function GrupoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const grupo = await prisma.grupo.findUnique({ where: { id } });
  if (!grupo) notFound();

  const updateGrupoWithId = updateGrupo.bind(null, grupo.id);
  const deleteGrupoWithId = deleteGrupo.bind(null, grupo.id);

  return (
    <div>
      <Link href="/admin/grupos" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Grupos
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">{grupo.codigo}</h1>
      <p className="mt-1 text-sm text-gris-500">{grupo.descripcion}</p>

      <div className="mt-8 max-w-xl rounded-lg border border-gris-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gris-900">Datos del grupo</h2>
        <form action={updateGrupoWithId} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Código *
            </label>
            <input
              name="codigo"
              required
              defaultValue={grupo.codigo}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Descripción *
            </label>
            <input
              name="descripcion"
              required
              defaultValue={grupo.descripcion}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-gris-100 pt-3">
            <label className="flex items-center gap-2 text-sm text-gris-700">
              <input
                name="insertar"
                type="checkbox"
                defaultChecked={grupo.insertar}
                className="rounded border-gris-300"
              />
              Insertar
            </label>
            <label className="flex items-center gap-2 text-sm text-gris-700">
              <input
                name="modificar"
                type="checkbox"
                defaultChecked={grupo.modificar}
                className="rounded border-gris-300"
              />
              Modificar
            </label>
            <label className="flex items-center gap-2 text-sm text-gris-700">
              <input
                name="borrar"
                type="checkbox"
                defaultChecked={grupo.borrar}
                className="rounded border-gris-300"
              />
              Borrar
            </label>
            <label className="flex items-center gap-2 text-sm text-gris-700">
              <input
                name="noUsar"
                type="checkbox"
                defaultChecked={grupo.noUsar}
                className="rounded border-gris-300"
              />
              No usar
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gris-700">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              rows={3}
              defaultValue={grupo.observaciones ?? ""}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
          >
            Guardar cambios
          </button>
        </form>

        <form action={deleteGrupoWithId} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar grupo
          </button>
        </form>
      </div>
    </div>
  );
}
