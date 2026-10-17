"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { ENTIDADES_CLASE } from "@/lib/clases";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// Cuenta cuántas filas de cada entidad referencian una Clase o Categoría
// puntual, para bloquear el borrado si hay datos relacionados (igual que
// verificarSinReferencias en el resto de la app).
async function referenciasDeClase(claseId: string) {
  const [aeronaves, activos, piezas, mantenimientosPreventivos, ordenesTrabajo, categorias] =
    await Promise.all([
      prisma.aeronave.count({ where: { claseId } }),
      prisma.activo.count({ where: { claseId } }),
      prisma.pieza.count({ where: { claseId } }),
      prisma.mantenimientoPreventivo.count({ where: { claseId } }),
      prisma.ordenTrabajo.count({ where: { claseId } }),
      prisma.categoria.count({ where: { claseId } }),
    ]);
  return [
    { nombre: "Aeronaves", cantidad: aeronaves },
    { nombre: "Activos", cantidad: activos },
    { nombre: "Piezas", cantidad: piezas },
    { nombre: "Mantenimientos Preventivos", cantidad: mantenimientosPreventivos },
    { nombre: "Órdenes de Trabajo", cantidad: ordenesTrabajo },
    { nombre: "Categorías", cantidad: categorias },
  ];
}

async function referenciasDeCategoria(categoriaId: string) {
  const [aeronaves, activos, piezas, mantenimientosPreventivos, ordenesTrabajo] =
    await Promise.all([
      prisma.aeronave.count({ where: { categoriaId } }),
      prisma.activo.count({ where: { categoriaId } }),
      prisma.pieza.count({ where: { categoriaId } }),
      prisma.mantenimientoPreventivo.count({ where: { categoriaId } }),
      prisma.ordenTrabajo.count({ where: { categoriaId } }),
    ]);
  return [
    { nombre: "Aeronaves", cantidad: aeronaves },
    { nombre: "Activos", cantidad: activos },
    { nombre: "Piezas", cantidad: piezas },
    { nombre: "Mantenimientos Preventivos", cantidad: mantenimientosPreventivos },
    { nombre: "Órdenes de Trabajo", cantidad: ordenesTrabajo },
  ];
}

export async function createClase(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const entidad = str(formData, "entidad");
    const nombre = str(formData, "nombre");
    if (!entidad || !nombre) throw new Error("Entidad y nombre son obligatorios");
    if (!ENTIDADES_CLASE.some((e) => e.entidad === entidad)) {
      throw new Error("Entidad inválida");
    }

    try {
      await prisma.clase.create({ data: { entidad, nombre } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(`Ya existe una clase "${nombre}" para esa entidad`);
      }
      throw error;
    }

    revalidatePath("/admin/clases");
  });
}

export async function deleteClase(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    verificarSinReferencias(await referenciasDeClase(id));

    await prisma.clase.delete({ where: { id } });
    revalidatePath("/admin/clases");
  });
}

export async function createCategoria(
  claseId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const nombre = str(formData, "nombre");
    if (!nombre) throw new Error("El nombre es obligatorio");

    try {
      await prisma.categoria.create({ data: { claseId, nombre } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(`Ya existe una categoría "${nombre}" en esta clase`);
      }
      throw error;
    }

    revalidatePath("/admin/clases");
  });
}

export async function deleteCategoria(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    verificarSinReferencias(await referenciasDeCategoria(id));

    await prisma.categoria.delete({ where: { id } });
    revalidatePath("/admin/clases");
  });
}
