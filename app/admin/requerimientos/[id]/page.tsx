import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  updateRequerimiento,
  deleteRequerimiento,
  createItem,
  deleteItem,
  updateItem,
  moverItems,
  enviarRequerimiento,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
} from "../actions";
import { ClaseCategoriaSelector } from "@/app/_components/clase-categoria-selector";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";
import { ItemsList } from "../items-list";
import { obtenerClases, obtenerCategoriasDeEntidad } from "@/lib/clases";
import { obtenerEstados, claseBadgeEstado } from "@/lib/estados";
import {
  TIPOS_REQUERIMIENTO,
  TIPO_REQUERIMIENTO_LABEL,
  nombreItem,
  unidadItem,
} from "@/lib/requerimientos";
import { obtenerPropietarioComercial, construirTransporterComercial } from "@/lib/mail-comercial";

export default async function RequerimientoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    requerimiento,
    clases,
    categorias,
    estados,
    estadosCotizacion,
    proveedores,
    propietarioComercial,
    session,
    piezas,
    servicios,
  ] = await Promise.all([
    prisma.requerimiento.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: "asc" }, include: { pieza: true, servicio: true } },
        envios: { orderBy: { enviadoAt: "desc" }, include: { proveedor: true } },
        cotizaciones: {
          orderBy: { createdAt: "asc" },
          include: { proveedor: true, estado: true, items: true },
        },
        estado: true,
      },
    }),
    obtenerClases("Requerimiento"),
    obtenerCategoriasDeEntidad("Requerimiento"),
    obtenerEstados("Requerimiento"),
    obtenerEstados("Cotizacion"),
    prisma.proveedor.findMany({
      orderBy: [{ clase: { nombre: "asc" } }, { nombre: "asc" }],
      include: { clase: true, categoria: true },
    }),
    obtenerPropietarioComercial(),
    auth(),
    prisma.pieza.findMany({ orderBy: { nombre: "asc" } }),
    prisma.servicio.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!requerimiento) notFound();

  const puedeAprobar =
    session?.user?.role === "ADMIN" || session?.user?.role === "ADMINISTRATIVO";
  const puedeEnviar = Boolean(
    propietarioComercial && construirTransporterComercial(propietarioComercial)
  );

  const requerimientosAbiertos = await prisma.requerimiento.findMany({
    where: {
      id: { not: requerimiento.id },
      tipo: requerimiento.tipo,
      estado: { rstatus: "ABIERTA" },
    },
    select: { id: true, codigo: true, titulo: true },
    orderBy: { codigo: "asc" },
  });

  const updateRequerimientoWithId = updateRequerimiento.bind(null, requerimiento.id);
  const deleteRequerimientoWithId = deleteRequerimiento.bind(null, requerimiento.id);
  const createItemWithId = createItem.bind(null, requerimiento.id);
  const deleteItemWithId = deleteItem.bind(null, requerimiento.id);
  const updateItemWithId = updateItem.bind(null, requerimiento.id);
  const moverItemsWithId = moverItems.bind(null, requerimiento.id);
  const enviarRequerimientoWithId = enviarRequerimiento.bind(null, requerimiento.id);
  const createCotizacionWithId = createCotizacion.bind(null, requerimiento.id);

  const ultimoEnvioPorProveedor = new Map(requerimiento.envios.map((e) => [e.proveedorId, e]));
  const proveedoresSinCotizacion = proveedores.filter(
    (p) => !requerimiento.cotizaciones.some((c) => c.proveedorId === p.id)
  );

  const opcionesCatalogo =
    requerimiento.tipo === "PRODUCTO"
      ? piezas.map((p) => ({ id: p.id, nombre: p.nombre, unidadMedida: p.unidadMedida }))
      : servicios.map((s) => ({ id: s.id, nombre: s.nombre, unidadMedida: s.unidadMedida }));
  const itemsResueltos = requerimiento.items.map((item) => ({
    id: item.id,
    cantidad: item.cantidad,
    piezaId: item.piezaId,
    servicioId: item.servicioId,
    nombre: nombreItem(item),
    unidad: unidadItem(item),
  }));

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
            <p className="mt-1 text-xs text-gris-400">
              Lo pedido sale del catálogo de {requerimiento.tipo === "PRODUCTO" ? "Piezas" : "Servicios"},
              nunca texto libre, para poder agrupar pedidos iguales entre requerimientos.
            </p>

            <div className="mt-4">
              <ItemsList
                tipoLabel={requerimiento.tipo === "PRODUCTO" ? "pieza" : "servicio"}
                items={itemsResueltos}
                puedeAprobar={puedeAprobar}
                opcionesCatalogo={opcionesCatalogo}
                requerimientosAbiertos={requerimientosAbiertos}
                deleteItemAction={deleteItemWithId}
                updateItemAction={updateItemWithId}
                moverItemsAction={moverItemsWithId}
              />
            </div>

            <ActionForm
              action={createItemWithId}
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-gris-100 pt-4"
            >
              <div className="flex-1 basis-full sm:basis-auto">
                <label className="block text-xs font-medium text-gris-700">
                  {requerimiento.tipo === "PRODUCTO" ? "Pieza" : "Servicio"}
                </label>
                <select
                  name={requerimiento.tipo === "PRODUCTO" ? "piezaId" : "servicioId"}
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="" disabled>
                    {requerimiento.tipo === "PRODUCTO" ? "Elegí una pieza" : "Elegí un servicio"}
                  </option>
                  {opcionesCatalogo.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nombre}
                    </option>
                  ))}
                </select>
                {opcionesCatalogo.length === 0 && (
                  <p className="mt-1 text-xs text-gris-400">
                    Todavía no hay{" "}
                    {requerimiento.tipo === "PRODUCTO" ? (
                      <Link href="/admin/piezas" className="text-celeste-700 hover:underline">
                        piezas cargadas
                      </Link>
                    ) : (
                      <Link href="/admin/servicios" className="text-celeste-700 hover:underline">
                        servicios cargados
                      </Link>
                    )}
                    .
                  </p>
                )}
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-gris-700">Cant.</label>
                <input
                  name="cantidad"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
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

            {!puedeAprobar && (
              <p className="mt-3 rounded-md border border-gris-200 bg-gris-50 px-3 py-2 text-xs text-gris-600">
                Elegir los proveedores y aprobar el envío de este requerimiento es prerrogativa de
                un administrador o administrativo.
              </p>
            )}

            {puedeAprobar && !puedeEnviar && (
              <p className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                Todavía no configuraste la casilla comercial del Propietario. Configurá Mail
                Comercial y las credenciales SMTP en{" "}
                <Link href="/admin/propietarios" className="font-medium underline">
                  Propietario
                </Link>{" "}
                antes de poder enviar Requerimientos.
              </p>
            )}

            {puedeAprobar && puedeEnviar && (
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

      {puedeAprobar && (
        <div className="mt-8 rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Cotizaciones</h2>
          <p className="mt-1 text-xs text-gris-400">
            Cargá acá la respuesta que mandó cada proveedor por mail: precio por ítem, estado y
            adjunto del presupuesto. Aceptar una cotización cierra solo el requerimiento.
          </p>

          {requerimiento.items.length === 0 && (
            <p className="mt-4 text-sm text-gris-500">
              Agregá ítems al requerimiento antes de cargar cotizaciones.
            </p>
          )}

          {requerimiento.items.length > 0 && requerimiento.cotizaciones.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gris-200 text-xs uppercase text-gris-500">
                  <tr>
                    <th className="px-3 py-2">Ítem</th>
                    {requerimiento.cotizaciones.map((cot) => (
                      <th key={cot.id} className="px-3 py-2 whitespace-nowrap">
                        {cot.proveedor.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gris-100">
                  {requerimiento.items.map((item) => {
                    const precios = requerimiento.cotizaciones.map((cot) => {
                      const ci = cot.items.find((i) => i.requerimientoItemId === item.id);
                      return ci ? ci.precioUnitario : null;
                    });
                    const conPrecio = precios.filter((p): p is number => p !== null);
                    const minimo = conPrecio.length > 0 ? Math.min(...conPrecio) : null;
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-gris-700">{nombreItem(item)}</td>
                        {requerimiento.cotizaciones.map((cot, idx) => {
                          const precio = precios[idx];
                          const esMinimo = precio !== null && precio === minimo;
                          return (
                            <td
                              key={cot.id}
                              className={`px-3 py-2 whitespace-nowrap ${
                                esMinimo ? "font-semibold text-green-700" : "text-gris-600"
                              }`}
                            >
                              {precio !== null ? `$${precio.toLocaleString("es-AR")}` : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="bg-gris-50 font-medium">
                    <td className="px-3 py-2">Total</td>
                    {requerimiento.cotizaciones.map((cot) => {
                      const total = cot.items.reduce((acc, ci) => {
                        const item = requerimiento.items.find(
                          (i) => i.id === ci.requerimientoItemId
                        );
                        return acc + ci.precioUnitario * (item?.cantidad ?? 1);
                      }, 0);
                      return (
                        <td key={cot.id} className="px-3 py-2 whitespace-nowrap">
                          ${total.toLocaleString("es-AR")}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {requerimiento.cotizaciones.map((cotizacion) => {
              const updateCotizacionWithId = updateCotizacion.bind(
                null,
                requerimiento.id,
                cotizacion.id
              );
              const deleteCotizacionWithId = deleteCotizacion.bind(
                null,
                requerimiento.id,
                cotizacion.id
              );
              const precioPorItem = new Map(
                cotizacion.items.map((ci) => [ci.requerimientoItemId, ci.precioUnitario])
              );

              return (
                <details key={cotizacion.id} className="rounded-lg border border-gris-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 hover:bg-gris-50">
                    <p className="text-sm font-medium text-gris-900">
                      {cotizacion.proveedor.nombre}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${claseBadgeEstado(cotizacion.estado.rstatus)}`}
                    >
                      {cotizacion.estado.status}
                    </span>
                  </summary>

                  <div className="border-t border-gris-100 p-4">
                    <ActionForm action={updateCotizacionWithId} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gris-700">Estado</label>
                        <select
                          name="estadoId"
                          defaultValue={cotizacion.estadoId}
                          className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                        >
                          {estadosCotizacion.map((estado) => (
                            <option key={estado.id} value={estado.id}>
                              {estado.status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gris-700">
                          Precios por ítem
                        </label>
                        {requerimiento.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span className="flex-1 text-xs text-gris-600">
                              {nombreItem(item)}
                            </span>
                            <input
                              name={`precio_${item.id}`}
                              type="number"
                              step="0.01"
                              placeholder="Sin cotizar"
                              defaultValue={precioPorItem.get(item.id) ?? ""}
                              className="w-28 rounded-md border border-gris-300 px-2 py-1 text-sm focus:border-celeste-600 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gris-700">
                          Observaciones
                        </label>
                        <textarea
                          name="observaciones"
                          rows={2}
                          defaultValue={cotizacion.observaciones ?? ""}
                          className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gris-700">Adjunto</label>
                        {cotizacion.adjuntoDataUrl && (
                          <a
                            href={cotizacion.adjuntoDataUrl}
                            download={cotizacion.adjuntoNombre ?? undefined}
                            className="mt-1 block text-xs text-celeste-700 hover:underline"
                          >
                            Ver adjunto actual
                            {cotizacion.adjuntoNombre ? `: ${cotizacion.adjuntoNombre}` : ""}
                          </a>
                        )}
                        <input
                          name="adjunto"
                          type="file"
                          accept="application/pdf,image/png,image/jpeg,image/webp"
                          className="mt-1 w-full text-xs"
                        />
                        <p className="mt-1 text-xs text-gris-400">
                          PDF, PNG, JPG o WEBP, hasta 5 MB. Dejalo vacío para mantener el adjunto
                          actual.
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-md border border-gris-300 py-1.5 text-xs font-medium text-gris-700 hover:bg-gris-50"
                      >
                        Guardar cotización
                      </button>
                    </ActionForm>

                    <div className="mt-3">
                      <ConfirmDeleteButton
                        action={deleteCotizacionWithId}
                        mensaje={`¿Eliminar la cotización de "${cotizacion.proveedor.nombre}"?`}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Eliminar cotización
                      </ConfirmDeleteButton>
                    </div>
                  </div>
                </details>
              );
            })}
            {requerimiento.cotizaciones.length === 0 && (
              <p className="text-sm text-gris-500">Todavía no se cargó ninguna cotización.</p>
            )}
          </div>

          {requerimiento.items.length > 0 && proveedoresSinCotizacion.length > 0 && (
            <ActionForm
              action={createCotizacionWithId}
              className="mt-6 space-y-3 border-t border-gris-100 pt-4"
            >
              <h3 className="text-xs font-semibold uppercase text-gris-500">Nueva cotización</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">Proveedor *</label>
                  <select
                    name="proveedorId"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    <option value="" disabled>
                      Elegí un proveedor
                    </option>
                    {proveedoresSinCotizacion.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">Estado *</label>
                  <select
                    name="estadoId"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                  >
                    <option value="" disabled>
                      Elegí un estado
                    </option>
                    {estadosCotizacion.map((estado) => (
                      <option key={estado.id} value={estado.id}>
                        {estado.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gris-700">
                  Precios por ítem
                </label>
                {requerimiento.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="flex-1 text-xs text-gris-600">{nombreItem(item)}</span>
                    <input
                      name={`precio_${item.id}`}
                      type="number"
                      step="0.01"
                      placeholder="Sin cotizar"
                      className="w-28 rounded-md border border-gris-300 px-2 py-1 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">Observaciones</label>
                <textarea
                  name="observaciones"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gris-700">Adjunto</label>
                <input
                  name="adjunto"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="mt-1 w-full text-xs"
                />
                <p className="mt-1 text-xs text-gris-400">PDF, PNG, JPG o WEBP, hasta 5 MB.</p>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Cargar cotización
              </button>
            </ActionForm>
          )}

          {requerimiento.items.length > 0 &&
            proveedoresSinCotizacion.length === 0 &&
            proveedores.length > 0 && (
              <p className="mt-6 border-t border-gris-100 pt-4 text-xs text-gris-400">
                Ya se cargó una cotización para todos los proveedores.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
