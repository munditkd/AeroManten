// Carga (o actualiza) los estados iniciales de la tabla genérica "Estado".
// Es seguro correrlo de nuevo: usa upsert por [tabla, propiedad, status].
//
// Uso: node prisma/seed-estados.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ESTADOS = [
  // Órdenes de Trabajo — rstatus: ABIERTA | CERRADA
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "Pendiente", rstatus: "ABIERTA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "En Ejecución", rstatus: "ABIERTA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "Detenida", rstatus: "ABIERTA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "En Espera", rstatus: "ABIERTA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "En Revisión", rstatus: "ABIERTA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "Aprobada", rstatus: "ABIERTA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "Terminada E/S", rstatus: "CERRADA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "Terminada F/S", rstatus: "CERRADA" },
  { tabla: "OrdenTrabajo", propiedad: "estado", status: "Cancelada", rstatus: "CERRADA" },

  // Activos — genéricos — rstatus: OPERATIVO | NO_OPERATIVO | BAJA
  { tabla: "Activo", propiedad: "estado", status: "Operativo", rstatus: "OPERATIVO" },
  { tabla: "Activo", propiedad: "estado", status: "No operativo", rstatus: "NO_OPERATIVO" },
  { tabla: "Activo", propiedad: "estado", status: "Baja", rstatus: "BAJA" },

  // Activos — específicos
  { tabla: "Activo", propiedad: "estado", status: "En Servicio", rstatus: "OPERATIVO" },
  { tabla: "Activo", propiedad: "estado", status: "Instalado", rstatus: "OPERATIVO" },
  { tabla: "Activo", propiedad: "estado", status: "En Reparación", rstatus: "NO_OPERATIVO" },
  { tabla: "Activo", propiedad: "estado", status: "Fuera de Servicio", rstatus: "NO_OPERATIVO" },
  { tabla: "Activo", propiedad: "estado", status: "Retirado", rstatus: "BAJA" },

  // Aeronaves — genéricos — rstatus: OPERATIVO | NO_OPERATIVO | BAJA
  { tabla: "Aeronave", propiedad: "estado", status: "Operativo", rstatus: "OPERATIVO" },
  { tabla: "Aeronave", propiedad: "estado", status: "No operativo", rstatus: "NO_OPERATIVO" },
  { tabla: "Aeronave", propiedad: "estado", status: "Baja", rstatus: "BAJA" },

  // Aeronaves — específicos. "En Servicio" = disponible; "En Operación" = en
  // vuelo, por despegar o en proceso de operación. Ambos son OPERATIVO.
  { tabla: "Aeronave", propiedad: "estado", status: "En Servicio", rstatus: "OPERATIVO" },
  { tabla: "Aeronave", propiedad: "estado", status: "En Operación", rstatus: "OPERATIVO" },
  { tabla: "Aeronave", propiedad: "estado", status: "En Reparación", rstatus: "NO_OPERATIVO" },
  { tabla: "Aeronave", propiedad: "estado", status: "Fuera de Servicio", rstatus: "NO_OPERATIVO" },
  { tabla: "Aeronave", propiedad: "estado", status: "Retirada", rstatus: "BAJA" },
];

async function main() {
  for (const estado of ESTADOS) {
    await prisma.estado.upsert({
      where: {
        tabla_propiedad_status: {
          tabla: estado.tabla,
          propiedad: estado.propiedad,
          status: estado.status,
        },
      },
      update: { rstatus: estado.rstatus },
      create: estado,
    });
  }
  console.log(`Sembrados/actualizados ${ESTADOS.length} estados.`);
}

main().then(() => process.exit(0));
