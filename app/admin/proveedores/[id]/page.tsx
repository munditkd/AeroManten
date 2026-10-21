import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProveedor, deleteProveedor } from "../actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";

export default async function ProveedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [proveedor, clases, categorias] = await Promise.all([
    prisma.proveedor.findUnique({ where: { id } }),
    obtenerClases("Proveedor"),
    obtenerCategoriasDeEntidad("Proveedor"),
  ]);

  if (!proveedor) notFound();

  const updateProveedorWithId = updateProveedor.bind(null, proveedor.id);
  const deleteProveedorWithId = deleteProveedor.bind(null, proveedor.id);

  return (
    <div>
      <Link href="/admin/proveedores" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Proveedores
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">{proveedor.nombre}</h1>

      <div className="mt-8 max-w-xl">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Datos del proveedor</h2>
          <ActionForm action={updateProveedorWithId} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Nombre / Razón social *
              </label>
              <input
                name="nombre"
                required
                defaultValue={proveedor.nombre}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">CUIT / Documento</label>
              <input
                name="documento"
                defaultValue={proveedor.documento ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Contacto</label>
                <input
                  name="contacto"
                  defaultValue={proveedor.contacto ?? ""}
                  placeholder="Nombre de la persona"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Teléfono</label>
                <input
                  name="telefono"
                  defaultValue={proveedor.telefono ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={proveedor.email ?? ""}
                placeholder="Donde recibe los pedidos de cotización"
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">Dirección</label>
              <input
                name="direccion"
                defaultValue={proveedor.direccion ?? ""}
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
                defaultValue={proveedor.observaciones ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>

            <ClaseCategoriaSelector
              clases={clases}
              categorias={categorias}
              claseIdInicial={proveedor.claseId ?? ""}
              categoriaIdInicial={proveedor.categoriaId ?? ""}
            />

            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar cambios
            </button>
          </ActionForm>

          <div className="mt-3">
            <ConfirmDeleteButton
              action={deleteProveedorWithId}
              mensaje={`¿Eliminar el proveedor "${proveedor.nombre}"? Esta acción no se puede deshacer.`}
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar proveedor
            </ConfirmDeleteButton>
          </div>
        </div>
      </div>
    </div>
  );
}
