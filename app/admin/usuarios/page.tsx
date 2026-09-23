import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function UsuariosPage() {
  const usuarios = await prisma.user.findMany({
    orderBy: { email: "asc" },
    include: { grupo: true, personal: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Usuarios</h1>
      <p className="mt-1 text-sm text-gris-500">
        Cuentas de acceso al sistema. El rol ADMIN tiene acceso total; el resto
        depende de los permisos del grupo asignado.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-gris-200 bg-white">
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
    </div>
  );
}
