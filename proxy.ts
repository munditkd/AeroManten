import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const ADMIN_ONLY_PREFIXES = [
    "/admin/personal",
    "/admin/grupos",
    "/admin/usuarios",
    "/admin/estados",
  ];
  const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix)
  );
  if (isAdminOnlyRoute && req.auth.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/perfil"],
};
