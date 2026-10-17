"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function createPiezaClase(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const nombre = str(formData, "nombre");
    if (!nombre) throw new Error("El nombre es obligatorio");

    try {
      await prisma.piezaClase.create({ data: { nombre } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(`Ya existe una clase "${nombre}"`);
      }
      throw error;
    }

    revalidatePath("/admin/piezas/clases");
  });
}

export async function deletePiezaClase(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const [categorias, piezas] = await Promise.all([
      prisma.piezaCategoria.count({ where: { claseId: id } }),
      prisma.pieza.count({ where: { claseId: id } }),
    ]);
    verificarSinReferencias([
      { nombre: "Categorías", cantidad: categorias },
      { nombre: "Piezas", cantidad: piezas },
    ]);

    await prisma.piezaClase.delete({ where: { id } });
    revalidatePath("/admin/piezas/clases");
  });
}

export async function createPiezaCategoria(
  claseId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const nombre = str(formData, "nombre");
    if (!nombre) throw new Error("El nombre es obligatorio");

    try {
      await prisma.piezaCategoria.create({ data: { claseId, nombre } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(`Ya existe una categoría "${nombre}" en esta clase`);
      }
      throw error;
    }

    revalidatePath("/admin/piezas/clases");
  });
}

export async function deletePiezaCategoria(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const piezas = await prisma.pieza.count({ where: { categoriaId: id } });
    verificarSinReferencias([{ nombre: "Piezas", cantidad: piezas }]);

    await prisma.piezaCategoria.delete({ where: { id } });
    revalidatePath("/admin/piezas/clases");
  });
}
