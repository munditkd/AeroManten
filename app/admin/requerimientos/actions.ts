"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarPermiso, verificarAprobacionRequerimientos } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { obtenerEstadoPorStatus, obtenerEstadoPorRstatus } from "@/lib/estados";
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
    const cotizaciones = await prisma.cotizacion.count({ where: { requerimientoId: id } });
    verificarSinReferencias([
      { nombre: "Ítems cargados", cantidad: items },
      { nombre: "Envíos registrados", cantidad: envios },
      { nombre: "Cotizaciones cargadas", cantidad: cotizaciones },
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
// Cualquier usuario con permiso puede crear un Requerimiento y cargar sus
// ítems, pero elegir los Proveedores y aprobar el envío de los mails es
// prerrogativa de ADMIN/ADMINISTRATIVO (ver también el gate en
// app/admin/requerimientos/[id]/page.tsx).
export async function enviarRequerimiento(
  requerimientoId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAprobacionRequerimientos();

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

const TIPOS_ADJUNTO_PERMITIDOS = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const TAMANO_MAXIMO_ADJUNTO = 5 * 1024 * 1024; // 5 MB

async function datosAdjuntoCotizacion(
  formData: FormData
): Promise<{ adjuntoDataUrl?: string; adjuntoNombre?: string }> {
  const archivo = formData.get("adjunto");
  if (!(archivo instanceof File) || archivo.size === 0) return {};

  if (!TIPOS_ADJUNTO_PERMITIDOS.includes(archivo.type)) {
    throw new Error("El adjunto tiene que ser un PDF, PNG, JPG o WEBP");
  }
  if (archivo.size > TAMANO_MAXIMO_ADJUNTO) {
    throw new Error("El adjunto no puede superar los 5 MB");
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  return {
    adjuntoDataUrl: `data:${archivo.type};base64,${buffer.toString("base64")}`,
    adjuntoNombre: archivo.name,
  };
}

// Un ítem sin precio cargado significa "el proveedor no cotizó esto", no un
// error: se omite en vez de exigir un valor para todos los ítems.
function datosCotizacionItems(
  formData: FormData,
  items: { id: string }[]
): { requerimientoItemId: string; precioUnitario: number }[] {
  const resultado: { requerimientoItemId: string; precioUnitario: number }[] = [];
  for (const item of items) {
    const valor = str(formData, `precio_${item.id}`);
    if (valor === undefined) continue;
    const precio = Number(valor);
    if (Number.isNaN(precio) || precio < 0) continue;
    resultado.push({ requerimientoItemId: item.id, precioUnitario: precio });
  }
  return resultado;
}

// Si el Estado elegido tiene rstatus "ACEPTADA", el Requerimiento pasa solo
// al primer Estado de tabla "Requerimiento" con rstatus "CERRADA" (si hay
// uno cargado en Administración → Estados; si no, no rompe el guardado,
// simplemente no se cierra solo).
async function cerrarRequerimientoSiCorresponde(requerimientoId: string, estadoId: string) {
  const estado = await prisma.estado.findUnique({ where: { id: estadoId } });
  if (estado?.rstatus !== "ACEPTADA") return;

  const cerrado = await obtenerEstadoPorRstatus("Requerimiento", "CERRADA");
  if (!cerrado) return;

  await prisma.requerimiento.update({
    where: { id: requerimientoId },
    data: { estadoId: cerrado.id },
  });
}

// Cargar la respuesta de un Proveedor (cotización) también es prerrogativa
// de ADMIN/ADMINISTRATIVO, igual que enviarRequerimiento.
export async function createCotizacion(
  requerimientoId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAprobacionRequerimientos();

    const proveedorId = str(formData, "proveedorId");
    const estadoId = str(formData, "estadoId");
    if (!proveedorId || !estadoId) {
      throw new Error("Proveedor y estado son obligatorios");
    }

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id: requerimientoId },
      include: { items: true },
    });
    if (!requerimiento) throw new Error("Requerimiento no encontrado");

    const existente = await prisma.cotizacion.findUnique({
      where: { requerimientoId_proveedorId: { requerimientoId, proveedorId } },
    });
    if (existente) {
      throw new Error("Este proveedor ya tiene una cotización cargada para este requerimiento. Editá esa en vez de crear otra.");
    }

    await prisma.cotizacion.create({
      data: {
        requerimientoId,
        proveedorId,
        estadoId,
        observaciones: str(formData, "observaciones") ?? null,
        ...(await datosAdjuntoCotizacion(formData)),
        items: { create: datosCotizacionItems(formData, requerimiento.items) },
      },
    });

    await cerrarRequerimientoSiCorresponde(requerimientoId, estadoId);

    revalidatePath(`/admin/requerimientos/${requerimientoId}`);
  });
}

export async function updateCotizacion(
  requerimientoId: string,
  cotizacionId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAprobacionRequerimientos();

    const estadoId = str(formData, "estadoId");
    if (!estadoId) throw new Error("El estado es obligatorio");

    const requerimiento = await prisma.requerimiento.findUnique({
      where: { id: requerimientoId },
      include: { items: true },
    });
    if (!requerimiento) throw new Error("Requerimiento no encontrado");

    await prisma.$transaction([
      prisma.cotizacionItem.deleteMany({ where: { cotizacionId } }),
      prisma.cotizacion.update({
        where: { id: cotizacionId },
        data: {
          estadoId,
          observaciones: str(formData, "observaciones") ?? null,
          ...(await datosAdjuntoCotizacion(formData)),
          items: { create: datosCotizacionItems(formData, requerimiento.items) },
        },
      }),
    ]);

    await cerrarRequerimientoSiCorresponde(requerimientoId, estadoId);

    revalidatePath(`/admin/requerimientos/${requerimientoId}`);
  });
}

export async function deleteCotizacion(
  requerimientoId: string,
  cotizacionId: string
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarAprobacionRequerimientos();

    await prisma.cotizacion.delete({ where: { id: cotizacionId } });
    revalidatePath(`/admin/requerimientos/${requerimientoId}`);
  });
}
