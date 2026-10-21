"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { obtenerEstadoPorStatus } from "@/lib/estados";
import { crearRequerimientoConCodigo, construirHtmlRequerimientoMail } from "@/lib/requerimientos";
import { obtenerPropietarioComercial, construirTransporterComercial } from "@/lib/mail-comercial";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";
import { TipoRequerimiento } from "@prisma/client";

const NOMBRE_SOFTWARE = "AeroManten";

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

export async function createRequerimiento(
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("insertar");

    const titulo = str(formData, "titulo");
    const tipo = str(formData, "tipo") as TipoRequerimiento | undefined;
    if (!titulo || !tipo || !Object.values(TipoRequerimiento).includes(tipo)) {
      throw new Error("Título y tipo (Producto o Servicio) son obligatorios");
    }

    const pendiente = await obtenerEstadoPorStatus("Requerimiento", "Pendiente");
    if (!pendiente) {
      throw new Error(
        'No hay estados cargados para Requerimientos. Cargá al menos uno llamado "Pendiente" en Administración → Estados.'
      );
    }

    await crearRequerimientoConCodigo({
      titulo,
      tipo,
      descripcion: str(formData, "descripcion") ?? null,
      claseId: optionalRelationId(formData, "claseId"),
      categoriaId: optionalRelationId(formData, "categoriaId"),
      estadoId: pendiente.id,
    });

    revalidatePath("/admin/requerimientos");
  });
}

export async function updateRequerimiento(
  id: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("modificar");

    const titulo = str(formData, "titulo");
    const tipo = str(formData, "tipo") as TipoRequerimiento | undefined;
    const estadoId = str(formData, "estadoId");
    if (!titulo || !tipo || !Object.values(TipoRequerimiento).includes(tipo) || !estadoId) {
      throw new Error("Título, tipo y estado son obligatorios");
    }

    await prisma.requerimiento.update({
      where: { id },
      data: {
        titulo,
        tipo,
        estadoId,
        descripcion: str(formData, "descripcion") ?? null,
        claseId: optionalRelationId(formData, "claseId"),
        categoriaId: optionalRelationId(formData, "categoriaId"),
      },
    });

    revalidatePath(`/admin/requerimientos/${id}`);
    revalidatePath("/admin/requerimientos");
  });
}

export async function deleteRequerimiento(id: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    const items = await prisma.requerimientoItem.count({ where: { requerimientoId: id } });
    const envios = await prisma.requerimientoEnvio.count({ where: { requerimientoId: id } });
    verificarSinReferencias([
      { nombre: "Ítems cargados", cantidad: items },
      { nombre: "Envíos registrados", cantidad: envios },
    ]);

    await prisma.requerimiento.delete({ where: { id } });
    revalidatePath("/admin/requerimientos");
    redirect("/admin/requerimientos");
  });
}

export async function createItem(
  requerimientoId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("insertar");

    const descripcion = str(formData, "descripcion");
    const cantidad = num(formData, "cantidad");
    if (!descripcion || cantidad === undefined) {
      throw new Error("Descripción y cantidad son obligatorias");
    }

    await prisma.requerimientoItem.create({
      data: {
        requerimientoId,
        descripcion,
        cantidad,
        unidadMedida: str(formData, "unidadMedida") ?? null,
      },
    });

    revalidatePath(`/admin/requerimientos/${requerimientoId}`);
  });
}

export async function deleteItem(requerimientoId: string, itemId: string): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    await prisma.requerimientoItem.delete({ where: { id: itemId } });
    revalidatePath(`/admin/requerimientos/${requerimientoId}`);
  });
}

// Manda el Requerimiento por mail a los Proveedores elegidos, usando la
// casilla comercial del Propietario (ver lib/mail-comercial.ts). Reenviar a
// un Proveedor ya notificado actualiza su mismo registro de envío (ver
// @@unique en RequerimientoEnvio) en vez de duplicarlo.
export async function enviarRequerimiento(
  requerimientoId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("modificar");

    const proveedorIds = formData.getAll("proveedorIds").filter((v): v is string => typeof v === "string");
    if (proveedorIds.length === 0) {
      throw new Error("Elegí al menos un proveedor para enviar el Requerimiento");
    }

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id: requerimientoId },
      include: { items: true },
    });
    if (!requerimiento) throw new Error("Requerimiento no encontrado");
    if (requerimiento.items.length === 0) {
      throw new Error("Cargá al menos un ítem antes de enviar el Requerimiento");
    }

    const propietario = await obtenerPropietarioComercial();
    const transporter = propietario ? construirTransporterComercial(propietario) : null;
    if (!propietario || !transporter) {
      throw new Error(
        "Todavía no configuraste la casilla comercial del Propietario (Mail Comercial + credenciales SMTP). Configurala en Propietario antes de enviar Requerimientos."
      );
    }

    const nombreEmpresa = propietario.empresa ?? NOMBRE_SOFTWARE;
    const html = construirHtmlRequerimientoMail(requerimiento, nombreEmpresa);
    const proveedores = await prisma.proveedor.findMany({ where: { id: { in: proveedorIds } } });

    const errores: string[] = [];

    for (const proveedor of proveedores) {
      if (!proveedor.email) {
        errores.push(`${proveedor.nombre}: no tiene email cargado`);
        await prisma.requerimientoEnvio.upsert({
          where: { requerimientoId_proveedorId: { requerimientoId, proveedorId: proveedor.id } },
          create: {
            requerimientoId,
            proveedorId: proveedor.id,
            mailEnviadoA: "",
            ok: false,
            error: "El proveedor no tiene email cargado",
          },
          update: { ok: false, error: "El proveedor no tiene email cargado", enviadoAt: new Date() },
        });
        continue;
      }

      try {
        await transporter.sendMail({
          from: `"${nombreEmpresa}" <${propietario.mailComercial}>`,
          to: proveedor.email,
          subject: `Pedido de cotización ${requerimiento.codigo} - ${requerimiento.titulo}`,
          html,
        });
        await prisma.requerimientoEnvio.upsert({
          where: { requerimientoId_proveedorId: { requerimientoId, proveedorId: proveedor.id } },
          create: {
            requerimientoId,
            proveedorId: proveedor.id,
            mailEnviadoA: proveedor.email,
            ok: true,
            error: null,
          },
          update: { mailEnviadoA: proveedor.email, ok: true, error: null, enviadoAt: new Date() },
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido al enviar";
        errores.push(`${proveedor.nombre}: ${mensaje}`);
        await prisma.requerimientoEnvio.upsert({
          where: { requerimientoId_proveedorId: { requerimientoId, proveedorId: proveedor.id } },
          create: {
            requerimientoId,
            proveedorId: proveedor.id,
            mailEnviadoA: proveedor.email,
            ok: false,
            error: mensaje,
          },
          update: { mailEnviadoA: proveedor.email, ok: false, error: mensaje, enviadoAt: new Date() },
        });
      }
    }

    revalidatePath(`/admin/requerimientos/${requerimientoId}`);

    if (errores.length > 0) {
      throw new Error(
        `Se envió a ${proveedores.length - errores.length} de ${proveedores.length} proveedores. Fallaron: ${errores.join("; ")}`
      );
    }
  });
}
