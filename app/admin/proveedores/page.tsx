import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProveedor } from "./actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ claseId?: string }>;
}) {
  const { claseId } = await searchParams;

  const [proveedores, clases, categorias] = await Promise.all([
    prisma.proveedor.findMany({
      where: claseId ? { claseId } : {},
      orderBy: { nombre: "asc" },
      include: { clase: true, categoria: true },
    }),
    obtenerClases("Proveedor"),
    obtenerCategoriasDeEntidad("Proveedor"),
  ]);

  const pill = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? "border-celeste-700 bg-celeste-700 text-white"
        : "border-gris-300 text-gris-700 hover:bg-gris-50"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Proveedores</h1>
      <p className="mt-1 text-sm text-gris-500">
        Proveedores de productos o servicios, agrupados por Clase/Rubro y Categoría para armar
        pedidos de cotización dirigidos a un grupo específico.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href="/admin/proveedores" className={pill(!claseId)}>
              Todos los Proveedores
            </Link>
            {clases.map((clase) => (
              <Link
                key={clase.id}
                href={`/admin/proveedores?claseId=${clase.id}`}
                className={pill(claseId === clase.id)}
              >
                {clase.nombre}
              </Link>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Rubro</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-100">
                {proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gris-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/proveedores/${proveedor.id}`}
                        className="font-medium text-celeste-700 hover:underline"
                      >
                        {proveedor.nombre}
                      </Link>
                      {proveedor.documento && (
                        <p className="text-xs text-gris-500">{proveedor.documento}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {proveedor.clase?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {proveedor.categoria?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                      {proveedor.telefono || proveedor.email || "—"}
                    </td>
                  </tr>
                ))}
                {proveedores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gris-500">
                      {claseId
                        ? "No hay proveedores con ese rubro."
                        : "Todavía no hay proveedores cargados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nuevo proveedor</h2>
            <ActionForm action={createProveedor} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Nombre / Razón social *
                </label>
                <input
                  name="nombre"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">CUIT / Documento</label>
                <input
                  name="documento"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Contacto</label>
                  <input
                    name="contacto"
                    placeholder="Nombre de la persona"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Teléfono</label>
                  <input
                    name="telefono"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Donde recibe los pedidos de cotización"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Dirección</label>
                <input
                  name="direccion"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Observaciones / sitio web
                </label>
                <textarea
                  name="observaciones"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <ClaseCategoriaSelector clases={clases} categorias={categorias} />

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear proveedor
              </button>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
