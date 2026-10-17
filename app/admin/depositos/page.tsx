import { prisma } from "@/lib/prisma";
import { createDeposito, deleteDeposito, createUbicacion, deleteUbicacion } from "./actions";
import { ActionForm } from "@/app/_components/action-form";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";

export default async function DepositosPage() {
  const depositos = await prisma.deposito.findMany({
    orderBy: { nombre: "asc" },
    include: { ubicaciones: { orderBy: { codigo: "asc" } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Depósitos y Ubicaciones</h1>
      <p className="mt-1 text-sm text-gris-500">
        Lugares físicos donde se guardan Activos y Piezas. Cada Ubicación combina
        Pasillo-Estante-Columna-Fila en un solo código (ej. A-3-2-5).
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {depositos.map((deposito) => {
            const deleteDepositoWithId = deleteDeposito.bind(null, deposito.id);
            const createUbicacionWithId = createUbicacion.bind(null, deposito.id);

            return (
              <div key={deposito.id} className="rounded-lg border border-gris-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gris-900">{deposito.nombre}</h2>
                  <ConfirmDeleteButton
                    action={deleteDepositoWithId}
                    mensaje={`¿Eliminar el depósito "${deposito.nombre}"?`}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Eliminar depósito
                  </ConfirmDeleteButton>
                </div>

                <ul className="mt-3 divide-y divide-gris-100">
                  {deposito.ubicaciones.map((ubicacion) => {
                    const deleteUbicacionWithId = deleteUbicacion.bind(null, ubicacion.id);
                    return (
                      <li
                        key={ubicacion.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="font-mono text-gris-700">{ubicacion.codigo}</span>
                        <ConfirmDeleteButton
                          action={deleteUbicacionWithId}
                          mensaje={`¿Eliminar la ubicación "${ubicacion.codigo}"?`}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Eliminar
                        </ConfirmDeleteButton>
                      </li>
                    );
                  })}
                  {deposito.ubicaciones.length === 0 && (
                    <li className="py-2 text-sm text-gris-500">Sin ubicaciones todavía.</li>
                  )}
                </ul>

                <ActionForm action={createUbicacionWithId} className="mt-3 grid grid-cols-4 gap-2">
                  <input
                    name="pasillo"
                    required
                    placeholder="Pasillo"
                    className="rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                  <input
                    name="estante"
                    required
                    placeholder="Estante"
                    className="rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                  <input
                    name="columna"
                    required
                    placeholder="Columna"
                    className="rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                  <input
                    name="fila"
                    required
                    placeholder="Fila"
                    className="rounded-md border border-gris-300 px-2 py-1.5 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="col-span-4 rounded-md border border-celeste-700 py-1.5 text-sm font-medium text-celeste-700 hover:bg-celeste-50"
                  >
                    Agregar ubicación
                  </button>
                </ActionForm>
              </div>
            );
          })}
          {depositos.length === 0 && (
            <p className="text-sm text-gris-500">Todavía no hay depósitos cargados.</p>
          )}
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nuevo depósito</h2>
            <ActionForm action={createDeposito} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Nombre *</label>
                <input
                  name="nombre"
                  required
                  placeholder="Ej: GENERAL"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear depósito
              </button>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  );
}
