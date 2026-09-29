import { prisma } from "@/lib/prisma";

export async function registrarLogin(usuario: string | null) {
  await prisma.auditoriaAcceso.create({ data: { usuario, accion: "LOGIN" } });
}

export async function registrarLogout(usuario: string | null) {
  await prisma.auditoriaAcceso.create({ data: { usuario, accion: "LOGOUT" } });
}
