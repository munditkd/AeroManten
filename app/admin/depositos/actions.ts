"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { construirCodigoUbicacion } from "@/lib/depositos";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

async function referenciasDeDeposito(depositoId: string) {
  const [ubicaciones, activos, piezas] = await Promise.all([
    prisma.ubicacion.count({ where: { depositoId } }),
    prisma.activo.count({ where: { depositoId } }),
    prisma.pieza.count({ where: { depositoId } }),
  ]);
  return [
    { nombre: "Ubicaciones", cantidad: ubicaciones },
    { nombre: "Activos", cantidad: activos },
    { nombre: "Piezas", cantidad: piezas },
  ];
}

async function referenciasDeUbicacion(ubicacionId: string) {
  const [activos, piezas] = await Promise.all([
    prisma.activo.count({ where: { ubicacionId } }),
    prisma.pieza.count({ where: { ubicacionId } }),
  ]);
  return [
    { nombre: "Activos", cantidad: activos },
    { nombre: "Piezas", cantidad: piezas },
  ];
}

export async function createDeposito(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const nombre = str(formData, "nombre");
    if (!nombre) throw new Error("El nombre es obligatorio");

    try {
      await prisma.deposito.create({ data: { nombre } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(`Ya existe un depósito "${nombre}"`);
      }
      throw error;
    }

    revalidatePath("/admin/depositos");
  });
}

export async function deleteDeposito(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    verificarSinReferencias(await referenciasDeDeposito(id));

    await prisma.deposito.delete({ where: { id } });
    revalidatePath("/admin/depositos");
  });
}

export async function createUbicacion(
  depositoId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const pasillo = str(formData, "pasillo");
    const estante = str(formData, "estante");
    const columna = str(formData, "columna");
    const fila = str(formData, "fila");
    if (!pasillo || !estante || !columna || !fila) {
      throw new Error("Pasillo, Estante, Columna y Fila son obligatorios");
    }

    const codigo = construirCodigoUbicacion(pasillo, estante, columna, fila);

    try {
      await prisma.ubicacion.create({ data: { depositoId, codigo } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(`Ya existe la ubicación "${codigo}" en este depósito`);
      }
      throw error;
    }

    revalidatePath("/admin/depositos");
  });
}

export async function deleteUbicacion(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    verificarSinReferencias(await referenciasDeUbicacion(id));

    await prisma.ubicacion.delete({ where: { id } });
    revalidatePath("/admin/depositos");
  });
}
