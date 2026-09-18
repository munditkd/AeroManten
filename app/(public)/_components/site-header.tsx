import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "../../_components/logout-button";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-gris-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-wide text-celeste-800">
            AEROMANTEN
          </span>
          <span className="hidden text-xs text-gris-500 sm:inline">
            Mantenimiento Aeronáutico
          </span>
        </Link>

        <nav className="flex items-center gap-6">
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

          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-gris-600 sm:inline">
                Hola, {session.user.name || session.user.email}
              </span>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-md bg-celeste-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-celeste-800"
                >
                  Panel admin
                </Link>
              )}
              <LogoutButton className="text-sm font-medium text-gris-500 hover:text-celeste-700" />
            </div>
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
        <ul className="mx-auto flex max-w-6xl justify-center gap-6 px-4 py-2 text-sm font-medium text-gris-700">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-celeste-700">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
