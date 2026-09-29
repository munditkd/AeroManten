import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrarLogout } from "@/lib/auditoria-accesos";
import type { NextFetchEvent, NextRequest } from "next/server";

const ACTIVITY_COOKIE = "am_last_activity";
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];
const IDLE_LOGOUT_MARKER = "motivo=inactividad";

function clearSessionCookies(response: NextResponse) {
  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.delete(name);
  }
  response.cookies.delete(ACTIVITY_COOKIE);
}

function cookieName(setCookieEntry: string): string {
  return setCookieEntry.split("=")[0];
}

// Dos cosas que Auth.js hace y que hay que corregir después de que corre:
//
// 1. Reemite la cookie de sesión con Expires/Max-Age en cada refresco
//    automático (rolling session) — no solo al loguearse, también en
//    requests normales de navegación. La sacamos para que la cookie no
//    vuelva a quedar persistente apenas se navega una página (ver también
//    app/api/auth/[...nextauth]/route.ts para el caso del login).
//
// 2. Cuando decidimos cerrar la sesión por inactividad y borramos la cookie
//    de sesión, Auth.js (que ya había validado el JWT como "todavía no
//    expiró", sin saber nada de nuestra regla de inactividad) vuelve a
//    agregar una cookie de sesión válida a continuación en la misma
//    respuesta, pisando nuestro borrado. Para ese caso puntual, en vez de
//    solo sacar Expires/Max-Age, se descarta cualquier Set-Cookie de sesión
//    que no sea el borrado.
function normalizarCookiesDeSesion(response: Response) {
  const setCookie = response.headers.getSetCookie();
  if (setCookie.length === 0) return;

  const esLogoutPorInactividad = (response.headers.get("location") ?? "").includes(
    IDLE_LOGOUT_MARKER
  );

  const resultado = setCookie
    .filter((cookie) => {
      if (!esLogoutPorInactividad) return true;
      const esCookieDeSesion = SESSION_COOKIE_NAMES.includes(cookieName(cookie));
      if (!esCookieDeSesion) return true;
      // Se queda solo el borrado (valor vacío); se descarta cualquier
      // reseteo que Auth.js haya agregado con un valor real.
      return cookie.startsWith(`${cookieName(cookie)}=;`);
    })
    .map((cookie) =>
      cookie
        .split("; ")
        .filter((part) => !/^(Expires|Max-Age)=/i.test(part))
        .join("; ")
    );

  response.headers.delete("Set-Cookie");
  for (const cookie of resultado) {
    response.headers.append("Set-Cookie", cookie);
  }
}

// `auth()` infiere mal el tipo de la función devuelta cuando se la llama a
// mano (en vez de dejar que Next.js la invoque como default export directo);
// en runtime es simplemente la firma de un middleware, así que se tipa así.
const withAuth = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Se busca en cada request (no se guarda en el JWT) para que un cambio de
  // preferencia en /perfil aplique de inmediato, sin esperar a un nuevo login.
  const usuario = await prisma.user.findUnique({
    where: { id: req.auth.user.id },
    select: { idleTimeoutMinutos: true },
  });
  const limiteMs = (usuario?.idleTimeoutMinutos ?? 60) * 60 * 1000;

  const ultimaActividad = req.cookies.get(ACTIVITY_COOKIE)?.value;
  const ahora = Date.now();

  if (ultimaActividad && ahora - Number(ultimaActividad) > limiteMs) {
    await registrarLogout(req.auth.user?.name || req.auth.user?.email || null);
    const response = NextResponse.redirect(new URL(`/login?${IDLE_LOGOUT_MARKER}`, req.url));
    clearSessionCookies(response);
    return response;
  }

  const ADMIN_ONLY_PREFIXES = [
    "/admin/personal",
    "/admin/grupos",
    "/admin/usuarios",
    "/admin/estados",
    "/admin/auditoria",
  ];
  const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix)
  );

  const response =
    isAdminOnlyRoute && req.auth.user?.role !== "ADMIN"
      ? NextResponse.redirect(new URL("/admin", req.url))
      : NextResponse.next();

  response.cookies.set(ACTIVITY_COOKIE, String(ahora), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}) as unknown as (req: NextRequest, event: NextFetchEvent) => Promise<Response | undefined>;

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const response = await withAuth(req, event);
  if (response) normalizarCookiesDeSesion(response);
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/perfil"],
};
