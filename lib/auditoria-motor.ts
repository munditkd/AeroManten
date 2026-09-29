import { Prisma, PrismaClient } from "@prisma/client";
import { obtenerTablaAuditable, RESOLVERS_FK } from "./auditoria-config";

// Cache corto de qué pares tabla+campo están activos, para no pegarle a la
// base en cada create/update/delete de TODO el sistema (la inmensa mayoría
// de las tablas no tienen nada auditado). Se invalida al tocar la config
// desde /admin/auditoria/campos.
let cache: Map<string, Set<string>> | null = null;
let cacheExpira = 0;
const CACHE_TTL_MS = 5000;

export function invalidarCacheAuditoria() {
  cache = null;
}

async function obtenerCamposAuditados(basePrisma: PrismaClient) {
  const ahora = Date.now();
  if (cache && ahora < cacheExpira) return cache;

  const filas = await basePrisma.campoAuditado.findMany();
  const mapa = new Map<string, Set<string>>();
  for (const fila of filas) {
    if (!mapa.has(fila.tabla)) mapa.set(fila.tabla, new Set());
    mapa.get(fila.tabla)!.add(fila.campo);
  }
  cache = mapa;
  cacheExpira = ahora + CACHE_TTL_MS;
  return mapa;
}

// Import dinámico para evitar el ciclo lib/prisma.ts -> lib/auth.ts ->
// lib/prisma.ts (auth.ts usa prisma para buscar el usuario al loguearse).
async function obtenerUsuarioActual(): Promise<string | null> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) return null;
    return session.user.name || session.user.email || null;
  } catch {
    // Corre fuera de un request (scripts de seed, CLI, etc.): sin usuario.
    return null;
  }
}

function formatearValor(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toLocaleDateString("es-AR");
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}

type Delegate = {
  findUnique: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
};

async function resolverValor(
  basePrisma: PrismaClient,
  campo: string,
  valor: unknown
): Promise<string | null> {
  if (valor === null || valor === undefined) return null;

  const resolver = RESOLVERS_FK[campo];
  if (resolver) {
    try {
      const delegate = (basePrisma as unknown as Record<string, Delegate>)[resolver.delegate];
      const row = await delegate.findUnique({ where: { id: valor } });
      if (row) return resolver.etiqueta(row);
    } catch {
      // Si falla la resolución (fila borrada, etc.), cae al valor crudo.
    }
    return String(valor);
  }

  return formatearValor(valor);
}

function valoresIguales(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a == null && b == null) return true;
  return false;
}

// Extensión de Prisma que intercepta create/update/delete de CUALQUIER
// modelo. Si la tabla no tiene ningún campo auditado activo, no hace nada
// extra (un solo find rápido contra el cache en memoria). Si tiene, registra
// una fila en Auditoria por cada campo auditado que cambió.
export function construirExtensionAuditoria(basePrisma: PrismaClient) {
  return Prisma.defineExtension({
    name: "auditoria",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tablaConfig = model ? obtenerTablaAuditable(model) : undefined;
          if (!tablaConfig) return query(args);

          const camposActivos = (await obtenerCamposAuditados(basePrisma)).get(model!);
          if (!camposActivos || camposActivos.size === 0) return query(args);

          const delegate = (
            basePrisma as unknown as Record<string, Delegate>
          )[tablaConfig.delegate];

          if (operation === "create") {
            const result = await query(args);
            const id = (result as Record<string, unknown> | null)?.id;
            const fresh = id ? await delegate.findUnique({ where: { id } }) : null;
            if (fresh) {
              const usuario = await obtenerUsuarioActual();
              for (const campo of camposActivos) {
                if (!(campo in fresh)) continue;
                const valorNuevo = await resolverValor(basePrisma, campo, fresh[campo]);
                if (valorNuevo === null) continue;
                await basePrisma.auditoria.create({
                  data: { tabla: model!, campo, accion: "INSERT", valorNuevo, usuario },
                });
              }
            }
            return result;
          }

          if (operation === "update" || operation === "upsert") {
            const where = (args as { where?: Record<string, unknown> }).where;
            const antes = where ? await delegate.findUnique({ where }) : null;
            const result = await query(args);
            const id = (result as Record<string, unknown> | null)?.id ?? antes?.id;
            const despues = id ? await delegate.findUnique({ where: { id } }) : null;

            if (antes && despues) {
              const usuario = await obtenerUsuarioActual();
              for (const campo of camposActivos) {
                if (!(campo in despues)) continue;
                if (valoresIguales(antes[campo], despues[campo])) continue;
                const valorAnterior = await resolverValor(basePrisma, campo, antes[campo]);
                const valorNuevo = await resolverValor(basePrisma, campo, despues[campo]);
                await basePrisma.auditoria.create({
                  data: { tabla: model!, campo, accion: "UPDATE", valorAnterior, valorNuevo, usuario },
                });
              }
            }
            return result;
          }

          if (operation === "delete") {
            const where = (args as { where?: Record<string, unknown> }).where;
            const antes = where ? await delegate.findUnique({ where }) : null;
            const result = await query(args);
            if (antes) {
              const usuario = await obtenerUsuarioActual();
              for (const campo of camposActivos) {
                const valorAnterior = await resolverValor(basePrisma, campo, antes[campo]);
                if (valorAnterior === null) continue;
                await basePrisma.auditoria.create({
                  data: { tabla: model!, campo, accion: "DELETE", valorAnterior, usuario },
                });
              }
            }
            return result;
          }

          return query(args);
        },
      },
    },
  });
}
