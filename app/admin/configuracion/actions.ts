"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/permisos";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function actualizarConfiguracionEmpresa(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const nombre = str(formData, "nombre");
    if (!nombre) throw new Error("El nombre de la empresa es obligatorio");

    const archivo = formData.get("logo");
    let logoDataUrl: string | undefined;

    if (archivo instanceof File && archivo.size > 0) {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        throw new Error("El logo tiene que ser una imagen PNG, JPG o WEBP");
      }
      if (archivo.size > TAMANO_MAXIMO) {
        throw new Error("El logo no puede superar los 2 MB");
      }
      const buffer = Buffer.from(await archivo.arrayBuffer());
      logoDataUrl = `data:${archivo.type};base64,${buffer.toString("base64")}`;
    }

    await prisma.configuracionEmpresa.upsert({
      where: { id: "config" },
      update: { nombre, ...(logoDataUrl ? { logoDataUrl } : {}) },
      create: { id: "config", nombre, logoDataUrl },
    });

    revalidatePath("/admin/configuracion");
  });
}
