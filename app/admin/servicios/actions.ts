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

function servicioData(formData: FormData) {
  return {
    descripcion: str(formData, "descripcion") ?? null,
    claseId: optionalRelationId(formData, "claseId"),
    categoriaId: optionalRelationId(formData, "categoriaId"),
  };
}

export async function createServicio(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("insertar");

    const nombre = str(formData, "nombre");
    const unidadMedida = str(formData, "unidadMedida");
    if (!nombre || !unidadMedida) {
      throw new Error("Nombre y unidad de medida son obligatorios");
    }

    await prisma.servicio.create({
      data: { nombre, unidadMedida, ...servicioData(formData) },
    });

    revalidatePath("/admin/servicios");
  });
}

export async function updateServicio(
  id: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("modificar");

    const nombre = str(formData, "nombre");
    const unidadMedida = str(formData, "unidadMedida");
    if (!nombre || !unidadMedida) {
      throw new Error("Nombre y unidad de medida son obligatorios");
    }

    await prisma.servicio.update({
      where: { id },
      data: { nombre, unidadMedida, ...servicioData(formData) },
    });

    revalidatePath(`/admin/servicios/${id}`);
    revalidatePath("/admin/servicios");
  });
}

export async function deleteServicio(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    const usos = await prisma.requerimientoItem.count({ where: { servicioId: id } });
    verificarSinReferencias([{ nombre: "Ítems de Requerimientos", cantidad: usos }]);

    await prisma.servicio.delete({ where: { id } });
    revalidatePath("/admin/servicios");
    redirect("/admin/servicios");
  });
}
