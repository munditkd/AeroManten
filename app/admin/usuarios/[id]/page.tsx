import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { updateUsuario } from "../actions";

export default async function UsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [usuario, grupos] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.grupo.findMany({ where: { noUsar: false }, orderBy: { codigo: "asc" } }),
  ]);

  if (!usuario) notFound();

  // Personas libres (sin usuario vinculado) más la que ya tenía vinculada
  // este usuario, si tenía una, para no perderla del <select>.
  const personalDisponible = await prisma.personal.findMany({
    where: usuario.personalId
      ? { OR: [{ user: null }, { id: usuario.personalId }] }
      : { user: null },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  const updateUsuarioWithId = updateUsuario.bind(null, usuario.id);

  return (
    <div>
      <Link href="/admin/usuarios" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Usuarios
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {usuario.username ?? usuario.name ?? usuario.email}
      </h1>
      <p className="mt-1 text-sm text-gris-500">{usuario.email}</p>

      <div className="mt-8 max-w-md rounded-lg border border-gris-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gris-900">Datos de la cuenta</h2>
        <form action={updateUsuarioWithId} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gris-700">Nombre</label>
            <input
              name="name"
              defaultValue={usuario.name ?? ""}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">Usuario *</label>
            <input
              name="username"
              required
              defaultValue={usuario.username ?? ""}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">Email *</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={usuario.email}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">Nueva contraseña</label>
            <input
              name="password"
              type="password"
              minLength={8}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gris-400">
              Dejalo vacío para no cambiar la contraseña actual.
            </p>
          </div>
          <div className="border-t border-gris-100 pt-3">
            <label className="block text-xs font-medium text-gris-700">Rol *</label>
            <select
              name="role"
              required
              defaultValue={usuario.role}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gris-400">
              ADMIN tiene acceso total, sin importar el grupo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gris-700">Grupo</label>
            <select
              name="grupoId"
              defaultValue={usuario.grupoId ?? ""}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            >
              <option value="">Sin grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.codigo} — {grupo.descripcion}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gris-400">
              Define qué puede insertar/modificar/borrar si no es ADMIN. Los
              grupos marcados "No usar" no aparecen acá.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gris-700">
              Persona vinculada (Personal)
            </label>
            <select
              name="personalId"
              defaultValue={usuario.personalId ?? ""}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            >
              <option value="">Sin vincular</option>
              {personalDisponible.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.apellido}, {persona.nombre}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gris-400">
              Se usa para completar solo el "originador" cuando esta cuenta
              crea una Orden de Trabajo.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
