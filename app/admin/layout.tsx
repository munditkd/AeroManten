import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "../_components/logout-button";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col bg-gris-50">
      <header className="border-b border-gris-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold text-celeste-800">
              AEROMANTEN <span className="text-gris-400">· Admin</span>
            </Link>
            <nav className="hidden gap-4 text-sm font-medium text-gris-700 sm:flex">
              <Link href="/admin" className="hover:text-celeste-700">
                Dashboard
              </Link>
              <Link href="/admin/propietarios" className="hover:text-celeste-700">
                Propietarios
              </Link>
              <Link href="/admin/aeronaves" className="hover:text-celeste-700">
                Aeronaves
              </Link>
              <Link href="/admin/activos" className="hover:text-celeste-700">
                Activos
              </Link>
              <Link href="/admin/medidores" className="hover:text-celeste-700">
                Carga de Medidores
              </Link>
              <Link href="/admin/mantenimiento-preventivo" className="hover:text-celeste-700">
                Mantenimiento Preventivo
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gris-500 sm:inline">
              {session?.user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
