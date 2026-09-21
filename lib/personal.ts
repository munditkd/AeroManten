import { RolPersonal } from "@prisma/client";

export const ROL_LABEL: Record<RolPersonal, string> = {
  PILOTO: "Piloto",
  MECANICO: "Mecánico",
  OPERARIO: "Operario",
  ADMINISTRATIVO: "Administrativo",
};

export const ROLES_PERSONAL = Object.values(RolPersonal);
