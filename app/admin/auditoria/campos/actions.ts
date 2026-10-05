"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/permisos";
import { obtenerCampoAuditable } from "@/lib/auditoria-config";
import { invalidarCacheAuditoria } from "@/lib/auditoria-motor";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";

export async function createCampoAuditado(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    const tabla = String(formData.get("tabla") ?? "");
    const campo = String(formData.get("campo") ?? "");
    if (!obtenerCampoAuditable(tabla, campo)) {
      throw new Error("Tabla o campo inválido");
    }

    await prisma.campoAuditado.upsert({
      where: { tabla_campo: { tabla, campo } },
      update: {},
      create: { tabla, campo },
    });

    invalidarCacheAuditoria();
    revalidatePath("/admin/auditoria/campos");
  });
}

export async function deleteCampoAuditado(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAdmin();

    await prisma.campoAuditado.delete({ where: { id } });

    invalidarCacheAuditoria();
    revalidatePath("/admin/auditoria/campos");
  });
}
