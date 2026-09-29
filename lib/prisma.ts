import { PrismaClient } from "@prisma/client";
import { construirExtensionAuditoria } from "./auditoria-motor";

// Evita crear múltiples instancias de PrismaClient en desarrollo
// (Next.js recarga módulos con hot-reload)
const globalForPrisma = global as unknown as { prismaBase: PrismaClient };

const basePrisma =
  globalForPrisma.prismaBase ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaBase = basePrisma;

// El resto de la app usa este cliente extendido; la auditoría queda
// transparente para todo el código existente (ver lib/auditoria-motor.ts).
export const prisma = basePrisma.$extends(construirExtensionAuditoria(basePrisma));
