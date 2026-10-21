import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  updatePropietario,
  deletePropietario,
  probarConexionComercial,
  quitarCredencialesSmtp,
} from "../actions";
import { createAeronave } from "../../aeronaves/actions";
import { TestConnectionButton } from "@/app/_components/test-connection-button";
import { ConfirmDeleteButton } from "@/app/_components/confirm-delete-button";

export default async function PropietarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [propietario, session] = await Promise.all([
    prisma.propietario.findUnique({
      where: { id },
      include: { aeronaves: { orderBy: { matricula: "asc" } } },
    }),
    auth(),
  ]);
  const esAdmin = session?.user?.role === "ADMIN";

  if (!propietario) notFound();

  const updatePropietarioWithId = updatePropietario.bind(null, propietario.id);
  const deletePropietarioWithId = deletePropietario.bind(null, propietario.id);
  const probarConexionComercialWithId = probarConexionComercial.bind(null, propietario.id);
  const quitarCredencialesSmtpWithId = quitarCredencialesSmtp.bind(null, propietario.id);
  const tieneCredencialesSmtp = Boolean(propietario.smtpHost && propietario.smtpUser);

  return (
    <div>
      <Link
        href="/admin/propietarios"
        className="text-sm text-gris-500 hover:text-celeste-700"
      >
        ← Propietario
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {propietario.nombre}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">
            Datos del propietario
          </h2>
          <form action={updatePropietarioWithId} className="mt-4 space-y-3">
            {esAdmin && (
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Empresa
                </label>
                <input
                  name="empresa"
                  maxLength={40}
                  defaultValue={propietario.empresa ?? ""}
                  placeholder="Nombre de la empresa que usa el software"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gris-400">
                  Se muestra en la franja azul del encabezado y en los reportes (máx. 40
                  caracteres).
                </p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Nombre / Razón social *
              </label>
              <input
                name="nombre"
                required
                defaultValue={propietario.nombre}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                DNI / CUIT
              </label>
              <input
                name="documento"
                defaultValue={propietario.documento ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Teléfono
              </label>
              <input
                name="telefono"
                defaultValue={propietario.telefono ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={propietario.email ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Dirección
              </label>
              <input
                name="direccion"
                defaultValue={propietario.direccion ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            {esAdmin && (
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Logo de la empresa
                </label>
                {propietario.logoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={propietario.logoDataUrl}
                    alt="Logo actual"
                    className="mt-2 h-16 w-16 rounded border border-gris-200 object-contain p-1"
                  />
                )}
                <input
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-2 w-full text-sm"
                />
                <p className="mt-1 text-xs text-gris-400">
                  PNG, JPG o WEBP, hasta 2 MB. Dejalo vacío para mantener el logo actual.
                </p>
              </div>
            )}
            {esAdmin && (
              <div className="space-y-3 border-t border-gris-200 pt-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-gris-500">
                    Casilla comercial
                  </h3>
                  <p className="mt-1 text-xs text-gris-400">
                    Para enviar Requerimientos a Proveedores desde esta dirección en vez de la
                    del sistema.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Mail Comercial
                  </label>
                  <input
                    name="mailComercial"
                    type="email"
                    defaultValue={propietario.mailComercial ?? ""}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Servidor SMTP
                  </label>
                  <input
                    name="smtpHost"
                    placeholder="smtp.gmail.com"
                    defaultValue={propietario.smtpHost ?? ""}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gris-700">Puerto</label>
                    <input
                      name="smtpPort"
                      type="number"
                      placeholder="587"
                      defaultValue={propietario.smtpPort ?? ""}
                      className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-gris-700">
                      <input
                        name="smtpSeguro"
                        type="checkbox"
                        defaultChecked={propietario.smtpSeguro}
                        className="h-4 w-4"
                      />
                      SSL directo (465)
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Usuario SMTP
                  </label>
                  <input
                    name="smtpUser"
                    defaultValue={propietario.smtpUser ?? ""}
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Contraseña SMTP
                  </label>
                  <input
                    name="smtpPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      propietario.smtpPasswordEncriptada
                        ? "•••••••• (dejar en blanco para no cambiarla)"
                        : "Contraseña de aplicación"
                    }
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gris-400">
                    Gmail/Outlook requieren una &quot;contraseña de aplicación&quot;, no la
                    contraseña normal de la cuenta.
                  </p>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar cambios
            </button>
          </form>

          {esAdmin && tieneCredencialesSmtp && (
            <div className="mt-3 space-y-2">
              <TestConnectionButton
                action={probarConexionComercialWithId}
                className="w-full rounded-md border border-gris-300 py-2 text-sm font-medium text-gris-700 hover:bg-gris-50"
              >
                Probar conexión SMTP guardada
              </TestConnectionButton>
              <ConfirmDeleteButton
                action={quitarCredencialesSmtpWithId}
                mensaje="¿Quitar las credenciales SMTP guardadas? El Mail Comercial se mantiene, pero no vas a poder enviar Requerimientos hasta volver a cargarlas."
                className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Quitar credenciales SMTP
              </ConfirmDeleteButton>
            </div>
          )}

          <form action={deletePropietarioWithId} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar propietario
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Aeronaves</h2>
            <ul className="mt-4 divide-y divide-gris-100">
              {propietario.aeronaves.map((aeronave) => (
                <li key={aeronave.id} className="py-3">
                  <Link
                    href={`/admin/aeronaves/${aeronave.id}`}
                    className="font-medium text-celeste-700 hover:underline"
                  >
                    {aeronave.matricula}
                  </Link>
                  <p className="text-xs text-gris-500">
                    {[aeronave.marca, aeronave.modelo]
                      .filter(Boolean)
                      .join(" ") || "Sin marca/modelo cargado"}
                  </p>
                </li>
              ))}
              {propietario.aeronaves.length === 0 && (
                <li className="py-3 text-sm text-gris-500">
                  Este propietario todavía no tiene aeronaves cargadas.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">
              Agregar aeronave
            </h2>
            <form action={createAeronave} className="mt-4 space-y-3">
              <input type="hidden" name="propietarioId" value={propietario.id} />
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Matrícula *
                </label>
                <input
                  name="matricula"
                  required
                  placeholder="LV-ABC"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm uppercase focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Marca
                  </label>
                  <input
                    name="marca"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gris-700">
                    Modelo
                  </label>
                  <input
                    name="modelo"
                    className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Número de serie
                </label>
                <input
                  name="numeroSerie"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-marron-600 py-2 text-sm font-medium text-white hover:bg-marron-700"
              >
                Agregar aeronave
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
