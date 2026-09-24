import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "../../_components/logout-button";
import { OperacionesMenu } from "../../_components/operaciones-menu";
import { AdministracionMenu } from "../../_components/administracion-menu";
import { UserMenu } from "../../_components/user-menu";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export async function SiteHeader() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <header className="border-b border-gris-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={loggedIn ? "/admin" : "/"} className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-wide text-celeste-800">
            AEROMANTEN
          </span>
          <span className="hidden text-xs text-gris-500 sm:inline">
            Mantenimiento Aeronáutico
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {loggedIn ? (
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin"
                className="text-sm font-medium text-gris-700 hover:text-celeste-700"
              >
                Dashboard
              </Link>
              <OperacionesMenu />
              {session.user.role === "ADMIN" && <AdministracionMenu />}
            </div>
          ) : (
            <ul className="hidden items-center gap-6 text-sm font-medium text-gris-700 md:flex">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-celeste-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {loggedIn ? (
            <UserMenu name={session.user.name} email={session.user.email}>
              <LogoutButton className="block w-full rounded px-2 py-2 text-left text-sm text-gris-700 hover:bg-gris-50 hover:text-celeste-700" />
            </UserMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/register"
                className="hidden text-sm font-medium text-gris-600 hover:text-celeste-700 sm:inline"
              >
                Registrarse
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-celeste-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-celeste-800"
              >
                Ingresar
              </Link>
            </div>
          )}
        </nav>
      </div>

      <nav className="border-t border-gris-100 md:hidden">
        {loggedIn ? (
          <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 py-2 text-sm font-medium text-gris-700">
            <li>
              <Link href="/admin" className="hover:text-celeste-700">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/propietarios" className="hover:text-celeste-700">
                Propietarios
              </Link>
            </li>
            <li>
              <Link href="/admin/aeronaves" className="hover:text-celeste-700">
                Aeronaves
              </Link>
            </li>
            <li>
              <Link href="/admin/activos" className="hover:text-celeste-700">
                Activos
              </Link>
            </li>
            <li>
              <Link href="/admin/vuelos" className="hover:text-celeste-700">
                Carga de Vuelos
              </Link>
            </li>
            <li>
              <Link href="/admin/mantenimiento-preventivo" className="hover:text-celeste-700">
                Mantenimiento Preventivo
              </Link>
            </li>
            <li>
              <Link href="/admin/ordenes-trabajo" className="hover:text-celeste-700">
                Órdenes de Trabajo
              </Link>
            </li>
            {session?.user?.role === "ADMIN" && (
              <>
                <li>
                  <Link href="/admin/personal" className="hover:text-celeste-700">
                    Personal
                  </Link>
                </li>
                <li>
                  <Link href="/admin/grupos" className="hover:text-celeste-700">
                    Grupos
                  </Link>
                </li>
                <li>
                  <Link href="/admin/usuarios" className="hover:text-celeste-700">
                    Usuarios
                  </Link>
                </li>
                <li>
                  <Link href="/admin/estados" className="hover:text-celeste-700">
                    Estados
                  </Link>
                </li>
              </>
            )}
          </ul>
        ) : (
          <ul className="mx-auto flex max-w-6xl justify-center gap-6 px-4 py-2 text-sm font-medium text-gris-700">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-celeste-700">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
