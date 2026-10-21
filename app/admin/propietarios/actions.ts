"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verificarPermiso, verificarAdmin } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { encriptar } from "@/lib/credenciales";
import { construirTransporterComercial } from "@/lib/mail-comercial";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";

const TIPOS_LOGO_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANO_MAXIMO_LOGO = 2 * 1024 * 1024; // 2 MB
const LARGO_MAXIMO_EMPRESA = 40;

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function num(formData: FormData, key: string): number | undefined {
  const value = str(formData, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

async function esAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// Empresa + Logo son exclusivos de ADMIN, aunque este formulario no lo sea:
// si quien envía el formulario no es ADMIN, estos campos se ignoran
// directamente (no alcanza con ocultarlos en la UI, hay que repetir el
// chequeo acá por si alguien arma el POST a mano).
async function datosEmpresa(formData: FormData): Promise<{ empresa?: string | null; logoDataUrl?: string }> {
  if (!(await esAdmin())) return {};

  const empresa = str(formData, "empresa") ?? null;
  if (empresa && empresa.length > LARGO_MAXIMO_EMPRESA) {
    throw new Error(`El nombre de la empresa no puede superar los ${LARGO_MAXIMO_EMPRESA} caracteres`);
  }

  const archivo = formData.get("logo");
  let logoDataUrl: string | undefined;
  if (archivo instanceof File && archivo.size > 0) {
    if (!TIPOS_LOGO_PERMITIDOS.includes(archivo.type)) {
      throw new Error("El logo tiene que ser una imagen PNG, JPG o WEBP");
    }
    if (archivo.size > TAMANO_MAXIMO_LOGO) {
      throw new Error("El logo no puede superar los 2 MB");
    }
    const buffer = Buffer.from(await archivo.arrayBuffer());
    logoDataUrl = `data:${archivo.type};base64,${buffer.toString("base64")}`;
  }

  return { empresa, ...(logoDataUrl ? { logoDataUrl } : {}) };
}

const PUERTO_MIN = 1;
const PUERTO_MAX = 65535;

// Mail Comercial + SMTP son exclusivos de ADMIN, igual que Empresa/Logo. La
// contraseña solo se toca si se escribió una nueva: dejarla vacía significa
// "mantener la que ya está guardada", nunca "borrarla" (para eso existe
// quitarCredencialesSmtp más abajo).
async function datosMailComercial(formData: FormData): Promise<{
  mailComercial?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpSeguro?: boolean;
  smtpPasswordEncriptada?: string;
}> {
  if (!(await esAdmin())) return {};

  const smtpPort = num(formData, "smtpPort") ?? null;
  if (smtpPort !== null && (smtpPort < PUERTO_MIN || smtpPort > PUERTO_MAX)) {
    throw new Error("El puerto SMTP tiene que ser un número entre 1 y 65535");
  }

  const smtpPasswordNueva = str(formData, "smtpPassword");

  return {
    mailComercial: str(formData, "mailComercial") ?? null,
    smtpHost: str(formData, "smtpHost") ?? null,
    smtpPort,
    smtpUser: str(formData, "smtpUser") ?? null,
    smtpSeguro: formData.get("smtpSeguro") === "on",
    ...(smtpPasswordNueva ? { smtpPasswordEncriptada: encriptar(smtpPasswordNueva) } : {}),
  };
}

export async function createPropietario(formData: FormData) {
  await verificarPermiso("insertar");

  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  await prisma.propietario.create({
    data: {
      nombre,
      documento: str(formData, "documento"),
      telefono: str(formData, "telefono"),
      email: str(formData, "email"),
      direccion: str(formData, "direccion"),
      ...(await datosEmpresa(formData)),
      ...(await datosMailComercial(formData)),
    },
  });

  revalidatePath("/admin/propietarios");
}

export async function updatePropietario(id: string, formData: FormData) {
  await verificarPermiso("modificar");

  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  await prisma.propietario.update({
    where: { id },
    data: {
      nombre,
      documento: str(formData, "documento"),
      telefono: str(formData, "telefono"),
      email: str(formData, "email"),
      direccion: str(formData, "direccion"),
      ...(await datosEmpresa(formData)),
      ...(await datosMailComercial(formData)),
    },
  });

  revalidatePath(`/admin/propietarios/${id}`);
  revalidatePath("/admin/propietarios");
}

export async function quitarCredencialesSmtp(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    await prisma.propietario.update({
      where: { id },
      data: {
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpPasswordEncriptada: null,
        smtpSeguro: false,
      },
    });

    revalidatePath(`/admin/propietarios/${id}`);
  });
}

export async function probarConexionComercial(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const propietario = await prisma.propietario.findUnique({ where: { id } });
    if (!propietario) throw new Error("Propietario no encontrado");

    const transporter = construirTransporterComercial(propietario);
    if (!transporter) {
      throw new Error(
        "Todavía no configuraste la casilla comercial: completá host, usuario y contraseña, y guardá los cambios antes de probar la conexión."
      );
    }

    await transporter.verify();
  });
}

export async function deletePropietario(id: string) {
  await verificarPermiso("borrar");

  const aeronaves = await prisma.aeronave.count({ where: { propietarioId: id } });
  verificarSinReferencias([{ nombre: "Aeronaves", cantidad: aeronaves }]);

  await prisma.propietario.delete({ where: { id } });
  revalidatePath("/admin/propietarios");
  redirect("/admin/propietarios");
}
