"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// Un valor vacío significa "sin relación" (null), no "no tocar el campo".
function optionalRelationId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function proveedorData(formData: FormData) {
  return {
    documento: str(formData, "documento") ?? null,
    contacto: str(formData, "contacto") ?? null,
    telefono: str(formData, "telefono") ?? null,
    email: str(formData, "email") ?? null,
    direccion: str(formData, "direccion") ?? null,
    observaciones: str(formData, "observaciones") ?? null,
    claseId: optionalRelationId(formData, "claseId"),
    categoriaId: optionalRelationId(formData, "categoriaId"),
  };
}

export async function createProveedor(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("insertar");

    const nombre = str(formData, "nombre");
    if (!nombre) {
      throw new Error("El nombre / razón social es obligatorio");
    }

    await prisma.proveedor.create({
      data: { nombre, ...proveedorData(formData) },
    });

    revalidatePath("/admin/proveedores");
  });
}

export async function updateProveedor(
  id: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("modificar");

    const nombre = str(formData, "nombre");
    if (!nombre) {
      throw new Error("El nombre / razón social es obligatorio");
    }

    await prisma.proveedor.update({
      where: { id },
      data: { nombre, ...proveedorData(formData) },
    });

    revalidatePath(`/admin/proveedores/${id}`);
    revalidatePath("/admin/proveedores");
  });
}

export async function deleteProveedor(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    const envios = await prisma.requerimientoEnvio.count({ where: { proveedorId: id } });
    verificarSinReferencias([{ nombre: "Envíos de Requerimientos", cantidad: envios }]);

    await prisma.proveedor.delete({ where: { id } });
    revalidatePath("/admin/proveedores");
    redirect("/admin/proveedores");
  });
}
