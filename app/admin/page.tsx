import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();

  const [propietarios, aeronaves, activos, mantenimientosPreventivos] = await Promise.all([
    prisma.propietario.count(),
    prisma.aeronave.count(),
    prisma.activo.count(),
    prisma.mantenimientoPreventivo.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">
        Panel de administración
      </h1>
      <p className="mt-1 text-sm text-gris-500">
        Bienvenido, {session?.user?.email}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col rounded-lg border border-gris-200 bg-white p-6">
          <p className="text-sm font-medium text-gris-500">Propietarios</p>
          <p className="mt-1 text-3xl font-semibold text-celeste-800">
            {propietarios}
          </p>
          <Link
            href="/admin/propietarios"
            className="mt-4 inline-block rounded-md bg-celeste-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-celeste-800"
          >
            Ver propietarios
          </Link>
        </div>
        <div className="flex flex-col rounded-lg border border-gris-200 bg-white p-6">
          <p className="text-sm font-medium text-gris-500">Aeronaves</p>
          <p className="mt-1 text-3xl font-semibold text-celeste-800">
            {aeronaves}
          </p>
          <Link
            href="/admin/aeronaves"
            className="mt-4 inline-block rounded-md border border-celeste-700 px-4 py-2 text-center text-sm font-medium text-celeste-700 hover:bg-celeste-50"
          >
            Ver aeronaves
          </Link>
        </div>
        <div className="flex flex-col rounded-lg border border-gris-200 bg-white p-6">
          <p className="text-sm font-medium text-gris-500">Activos</p>
          <p className="mt-1 text-3xl font-semibold text-celeste-800">
            {activos}
          </p>
          <Link
            href="/admin/activos"
            className="mt-4 inline-block rounded-md border border-celeste-700 px-4 py-2 text-center text-sm font-medium text-celeste-700 hover:bg-celeste-50"
          >
            Ver activos
          </Link>
        </div>
        <div className="flex flex-col rounded-lg border border-gris-200 bg-white p-6">
          <p className="text-sm font-medium text-gris-500">
            Mantenimientos Preventivos
          </p>
          <p className="mt-1 text-3xl font-semibold text-celeste-800">
            {mantenimientosPreventivos}
          </p>
          <Link
            href="/admin/mantenimiento-preventivo"
            className="mt-4 inline-block rounded-md border border-celeste-700 px-4 py-2 text-center text-sm font-medium text-celeste-700 hover:bg-celeste-50"
          >
            Ver MP
          </Link>
        </div>
      </div>
    </div>
  );
}
