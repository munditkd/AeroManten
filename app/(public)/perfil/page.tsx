import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/app/_components/action-form";
import { actualizarIdleTimeout, cambiarPassword } from "./actions";

const IDLE_TIMEOUT_OPCIONES = [30, 60, 120, 180];

export default async function PerfilPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, username: true, email: true, role: true, idleTimeoutMinutos: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-gris-900">Mi perfil</h1>

      <div className="mt-6 rounded-lg border border-gris-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gris-900">Datos de la cuenta</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gris-500">Nombre</dt>
            <dd className="text-gris-900">{user?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gris-500">Usuario</dt>
            <dd className="text-gris-900">{user?.username ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gris-500">Email</dt>
            <dd className="text-gris-900">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gris-500">Rol</dt>
            <dd className="text-gris-900">{user?.role ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-lg border border-gris-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gris-900">Sesión</h2>
        <p className="mt-1 text-xs text-gris-500">
          Si no hacés nada en el sistema durante este tiempo, se cierra tu sesión sola. También se
          cierra si cerrás el navegador.
        </p>
        <ActionForm action={actualizarIdleTimeout} className="mt-4 max-w-xs">
          <label className="block text-xs font-medium text-gris-700">
            Cerrar sesión por inactividad después de
          </label>
          <div className="mt-1 flex gap-2">
            <select
              name="idleTimeoutMinutos"
              defaultValue={user?.idleTimeoutMinutos ?? 60}
              className="w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            >
              {IDLE_TIMEOUT_OPCIONES.map((minutos) => (
                <option key={minutos} value={minutos}>
                  {minutos} minutos
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-md bg-celeste-700 px-4 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="mt-6 rounded-lg border border-gris-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gris-900">Cambiar contraseña</h2>
        <ActionForm action={cambiarPassword} className="mt-4 max-w-sm space-y-3">
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Contraseña actual
            </label>
            <input
              name="actual"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Nueva contraseña
            </label>
            <input
              name="nueva"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gris-400">Mínimo 8 caracteres</p>
          </div>
          <button
            type="submit"
            className="rounded-md bg-celeste-700 px-4 py-2 text-sm font-medium text-white hover:bg-celeste-800"
          >
            Actualizar contraseña
          </button>
        </ActionForm>
      </div>
    </div>
  );
}
