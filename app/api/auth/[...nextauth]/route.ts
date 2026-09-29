import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

export const { GET } = handlers;

// Auth.js siempre fija Expires/Max-Age en la cookie de sesión (calculado a
// partir de session.maxAge), sin una opción de configuración para evitarlo.
// Se lo sacamos acá para que quede como cookie de sesión del navegador: se
// borra sola al cerrar el navegador, sin depender de que el usuario cierre
// sesión manualmente. El JWT sigue teniendo su propio "exp" interno como
// techo de seguridad, eso no cambia.
export async function POST(request: NextRequest): Promise<Response> {
  const response = await handlers.POST(request);

  const setCookie = response.headers.getSetCookie();
  if (setCookie.length === 0) return response;

  const stripped = setCookie.map((cookie) =>
    cookie.includes("authjs.session-token")
      ? cookie
          .split("; ")
          .filter((part) => !/^(Expires|Max-Age)=/i.test(part))
          .join("; ")
      : cookie
  );

  const nuevaRespuesta = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  nuevaRespuesta.headers.delete("Set-Cookie");
  for (const cookie of stripped) {
    nuevaRespuesta.headers.append("Set-Cookie", cookie);
  }
  return nuevaRespuesta;
}
