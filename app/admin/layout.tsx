import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "../_components/logout-button";
import { OperacionesMenu } from "../_components/operaciones-menu";
import { AdministracionMenu } from "../_components/administracion-menu";
import { UserMenu } from "../_components/user-menu";
import { BrandStrip } from "../_components/brand-strip";

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
            <nav className="hidden items-center gap-6 sm:flex">
              <Link href="/admin" className="text-sm font-medium text-gris-700 hover:text-celeste-700">
                Dashboard
              </Link>
              <OperacionesMenu />
              {session?.user?.role === "ADMIN" && <AdministracionMenu />}
            </nav>
          </div>

          <UserMenu name={session?.user?.name} email={session?.user?.email}>
            <LogoutButton className="block w-full rounded px-2 py-2 text-left text-sm text-gris-700 hover:bg-gris-50 hover:text-celeste-700" />
          </UserMenu>
        </div>
      </header>

      <BrandStrip />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
