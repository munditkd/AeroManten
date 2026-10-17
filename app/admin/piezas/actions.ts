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

function num(formData: FormData, key: string): number | undefined {
  const value = str(formData, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

// Un valor vacío significa "sin relación" (null), no "no tocar el campo".
function optionalRelationId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function piezaData(formData: FormData) {
  return {
    descripcion: str(formData, "descripcion") ?? null,
    claseId: optionalRelationId(formData, "claseId"),
    categoriaId: optionalRelationId(formData, "categoriaId"),
  };
}

export async function createPieza(
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

    await prisma.pieza.create({
      data: {
        nombre,
        unidadMedida,
        stock: num(formData, "stock") ?? 0,
        ...piezaData(formData),
      },
    });

    revalidatePath("/admin/piezas");
  });
}

export async function updatePieza(
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

    await prisma.pieza.update({
      where: { id },
      data: {
        nombre,
        unidadMedida,
        stock: num(formData, "stock") ?? 0,
        ...piezaData(formData),
      },
    });

    revalidatePath(`/admin/piezas/${id}`);
    revalidatePath("/admin/piezas");
  });
}

export async function deletePieza(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    const usos = await prisma.ordenTrabajoTareaPieza.count({ where: { piezaId: id } });
    verificarSinReferencias([{ nombre: "Usos registrados en Tareas de OT", cantidad: usos }]);

    await prisma.pieza.delete({ where: { id } });
    revalidatePath("/admin/piezas");
    redirect("/admin/piezas");
  });
}
