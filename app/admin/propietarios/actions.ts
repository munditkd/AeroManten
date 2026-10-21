"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verificarPermiso } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";

const TIPOS_LOGO_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANO_MAXIMO_LOGO = 2 * 1024 * 1024; // 2 MB
const LARGO_MAXIMO_EMPRESA = 40;

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
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

// Mail Comercial es exclusivo de ADMIN, igual que Empresa/Logo. El envío en
// sí usa la BREVO_API_KEY del servidor (ver lib/mail-comercial.ts), no una
// credencial por Propietario.
async function datosMailComercial(formData: FormData): Promise<{ mailComercial?: string | null }> {
  if (!(await esAdmin())) return {};
  return { mailComercial: str(formData, "mailComercial") ?? null };
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

export async function deletePropietario(id: string) {
  await verificarPermiso("borrar");

  const aeronaves = await prisma.aeronave.count({ where: { propietarioId: id } });
  verificarSinReferencias([{ nombre: "Aeronaves", cantidad: aeronaves }]);

  await prisma.propietario.delete({ where: { id } });
  revalidatePath("/admin/propietarios");
  redirect("/admin/propietarios");
}
