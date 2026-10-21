import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  updateRequerimiento,
  deleteRequerimiento,
  createItem,
  deleteItem,
  enviarRequerimiento,
} from "../actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";
import { obtenerEstados, claseBadgeEstado } from "@/lib/estados";
import { TIPOS_REQUERIMIENTO, TIPO_REQUERIMIENTO_LABEL } from "@/lib/requerimientos";
import { obtenerPropietarioComercial, construirTransporterComercial } from "@/lib/mail-comercial";

export default async function RequerimientoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [requerimiento, clases, categorias, estados, proveedores, propietarioComercial, session] =
    await Promise.all([
      prisma.requerimiento.findUnique({
        where: { id },
        include: {
          items: { orderBy: { createdAt: "asc" } },
          envios: { orderBy: { enviadoAt: "desc" }, include: { proveedor: true } },
          estado: true,
        },
      }),
      obtenerClases("Requerimiento"),
      obtenerCategoriasDeEntidad("Requerimiento"),
      obtenerEstados("Requerimiento"),
      prisma.proveedor.findMany({
        orderBy: [{ clase: { nombre: "asc" } }, { nombre: "asc" }],
        include: { clase: true, categoria: true },
      }),
      obtenerPropietarioComercial(),
      auth(),
    ]);

  if (!requerimiento) notFound();

  const esAdmin = session?.user?.role === "ADMIN";
  const puedeEnviar = Boolean(
    propietarioComercial && construirTransporterComercial(propietarioComercial)
  );

  const updateRequerimientoWithId = updateRequerimiento.bind(null, requerimiento.id);
  const deleteRequerimientoWithId = deleteRequerimiento.bind(null, requerimiento.id);
  const createItemWithId = createItem.bind(null, requerimiento.id);
  const enviarRequerimientoWithId = enviarRequerimiento.bind(null, requerimiento.id);

  const ultimoEnvioPorProveedor = new Map(requerimiento.envios.map((e) => [e.proveedorId, e]));

  return (
    <div>
      <Link href="/admin/requerimientos" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Requerimientos
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-gris-900">{requerimiento.codigo}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${claseBadgeEstado(requerimiento.estado.rstatus)}`}
        >
          {requerimiento.estado.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-gris-500">{requerimiento.titulo}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Datos del requerimiento</h2>
            <ActionForm action={updateRequerimientoWithId} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Título *</label>
                <input
                  name="titulo"
                  required
                  defaultValue={requerimiento.titulo}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Tipo *</label>
                  <select
                    name="tipo"
                    required
                    defaultValue={requerimiento.tipo}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    {TIPOS_REQUERIMIENTO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {TIPO_REQUERIMIENTO_LABEL[tipo]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Estado *</label>
                  <select
                    name="estadoId"
                    required
                    defaultValue={requerimiento.estadoId}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    {estados.map((estado) => (
                      <option key={estado.id} value={estado.id}>
                        {estado.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={3}
                  defaultValue={requerimiento.descripcion ?? ""}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <ClaseCategoriaSelector
                clases={clases}
                categorias={categorias}
                claseIdInicial={requerimiento.claseId ?? ""}
                categoriaIdInicial={requerimiento.categoriaId ?? ""}
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
                action={deleteRequerimientoWithId}
                mensaje={`¿Eliminar el requerimiento "${requerimiento.codigo}"? Esta acción no se puede deshacer.`}
                className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Eliminar requerimiento
              </ConfirmDeleteButton>
            </div>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Ítems</h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {requerimiento.items.map((item) => {
                const deleteItemWithId = deleteItem.bind(null, requerimiento.id, item.id);
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm text-gris-900">{item.descripcion}</p>
                      <p className="text-xs text-gris-500">
                        {item.cantidad} {item.unidadMedida ?? ""}
                      </p>
                    </div>
                    <ConfirmDeleteButton
                      action={deleteItemWithId}
                      mensaje={`¿Quitar "${item.descripcion}" del requerimiento?`}
                      className="shrink-0 text-xs font-medium text-red-500 hover:underline"
                    >
                      Quitar
                    </ConfirmDeleteButton>
                  </li>
                );
              })}
              {requerimiento.items.length === 0 && (
                <li className="py-3 text-sm text-gris-500">Todavía no hay ítems cargados.</li>
              )}
            </ul>

            <ActionForm
              action={createItemWithId}
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-gris-100 pt-4"
            >
              <div className="flex-1 basis-full sm:basis-auto">
                <label className="block text-xs font-medium text-gris-700">Descripción</label>
                <input
                  name="descripcion"
                  required
                  placeholder="Ej: Filtro de aceite"
                  className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-gris-700">Cant.</label>
                <input
                  name="cantidad"
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-gris-700">Unidad</label>
                <input
                  name="unidadMedida"
                  placeholder="Unidad"
                  className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-md border border-celeste-700 px-3 py-1.5 text-xs font-medium text-celeste-700 hover:bg-celeste-50"
              >
                Agregar
              </button>
            </ActionForm>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Enviar a Proveedores</h2>

            {!esAdmin && (
              <p className="mt-3 rounded-md border border-gris-200 bg-gris-50 px-3 py-2 text-xs text-gris-600">
                Elegir los proveedores y aprobar el envío de este requerimiento es exclusivo de un
                administrador.
              </p>
            )}

            {esAdmin && !puedeEnviar && (
              <p className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                Todavía no configuraste la casilla comercial del Propietario. Configurá Mail
                Comercial y las credenciales SMTP en{" "}
                <Link href="/admin/propietarios" className="font-medium underline">
                  Propietario
                </Link>{" "}
                antes de poder enviar Requerimientos.
              </p>
            )}

            {esAdmin && puedeEnviar && (
              <ActionForm action={enviarRequerimientoWithId} className="mt-4 space-y-3">
                <ul className="max-h-80 space-y-1 overflow-y-auto rounded-md border border-gris-200 p-2">
                  {proveedores.map((proveedor) => {
                    const mismoRubro =
                      requerimiento.claseId && proveedor.claseId === requerimiento.claseId;
                    const envioPrevio = ultimoEnvioPorProveedor.get(proveedor.id);
                    return (
                      <li key={proveedor.id} className="flex items-center justify-between gap-2 py-1">
                        <label className="flex flex-1 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="proveedorIds"
                            value={proveedor.id}
                            defaultChecked={Boolean(mismoRubro)}
                            className="h-4 w-4"
                          />
                          <span className={proveedor.email ? "" : "text-gris-400"}>
                            {proveedor.nombre}
                            {!proveedor.email && " (sin email)"}
                          </span>
                          {proveedor.clase && (
                            <span className="text-xs text-gris-400">{proveedor.clase.nombre}</span>
                          )}
                        </label>
                        {envioPrevio && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              envioPrevio.ok
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {envioPrevio.ok ? "Enviado" : "Error"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                  {proveedores.length === 0 && (
                    <li className="py-2 text-sm text-gris-500">Todavía no hay proveedores cargados.</li>
                  )}
                </ul>

                <button
                  type="submit"
                  className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
                >
                  Enviar requerimiento
                </button>
              </ActionForm>
            )}
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Historial de envíos</h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {requerimiento.envios.map((envio) => (
                <li key={envio.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gris-900">{envio.proveedor.nombre}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        envio.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {envio.ok ? "Enviado" : "Error"}
                    </span>
                  </div>
                  <p className="text-xs text-gris-500">
                    {envio.mailEnviadoA || "—"} — {envio.enviadoAt.toLocaleString("es-AR")}
                  </p>
                  {envio.error && <p className="mt-1 text-xs text-red-600">{envio.error}</p>}
                </li>
              ))}
              {requerimiento.envios.length === 0 && (
                <li className="py-3 text-sm text-gris-500">Todavía no se envió este requerimiento.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
