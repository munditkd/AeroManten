// Deja habilitados los campos de prueba pedidos para arrancar con Auditoría.
// Es seguro correrlo de nuevo: usa upsert por [tabla, campo].
//
// Uso: node prisma/seed-campos-auditados.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CAMPOS = [
  { tabla: "Activo", campo: "codigo" },
  { tabla: "Activo", campo: "estadoId" },
];

async function main() {
  for (const campo of CAMPOS) {
    await prisma.campoAuditado.upsert({
      where: { tabla_campo: { tabla: campo.tabla, campo: campo.campo } },
      update: {},
      create: campo,
    });
  }
  console.log(`Sembrados/actualizados ${CAMPOS.length} campos auditados.`);
}

main().then(() => process.exit(0));
