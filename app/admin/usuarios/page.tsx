import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createUsuario } from "./actions";

export default async function UsuariosPage() {
  const [usuarios, grupos, personalDisponible] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: { grupo: true, personal: true },
    }),
    prisma.grupo.findMany({ where: { noUsar: false }, orderBy: { codigo: "asc" } }),
    prisma.personal.findMany({
      where: { user: null },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Usuarios</h1>
      <p className="mt-1 text-sm text-gris-500">
        Cuentas de acceso al sistema. El rol ADMIN tiene acceso total; el resto
        depende de los permisos del grupo asignado.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-x-auto rounded-lg border border-gris-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gris-200 bg-gris-50 text-xs uppercase text-gris-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Persona vinculada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gris-100">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gris-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/usuarios/${usuario.id}`}
                      className="font-medium text-celeste-700 hover:underline"
                    >
                      {usuario.username ?? usuario.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">{usuario.email}</td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">{usuario.role}</td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {usuario.grupo?.codigo ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gris-600 whitespace-nowrap">
                    {usuario.personal
                      ? `${usuario.personal.apellido}, ${usuario.personal.nombre}`
                      : "—"}
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gris-500">
                    Todavía no hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="rounded-lg border border-gris-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gris-900">Nuevo usuario</h2>
            <form action={createUsuario} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gris-700">Nombre</label>
                <input
                  name="name"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Usuario *</label>
                <input
                  name="username"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Contraseña *</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gris-400">Mínimo 8 caracteres.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Rol *</label>
                <select
                  name="role"
                  required
                  defaultValue="USER"
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  {Object.values(Role).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">Grupo</label>
                <select
                  name="grupoId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.codigo} — {grupo.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gris-700">
                  Persona vinculada (Personal)
                </label>
                <select
                  name="personalId"
                  defaultValue=""
                  className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
                >
                  <option value="">Sin vincular</option>
                  {personalDisponible.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.apellido}, {persona.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
              >
                Crear usuario
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
