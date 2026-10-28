import { TipoVuelo } from "@prisma/client";

export const TIPO_VUELO_LABEL: Record<TipoVuelo, string> = {
  TRANSPORTE_PASAJEROS: "Transporte de pasajeros",
  TRASLADO_AEREO: "Traslado aéreo",
  CORREO: "Correo",
  TRANSPORTE_CARGA: "Transporte de carga",
  PARACAIDISMO: "Paracaidismo",
  REMOLQUE_PLANEADOR: "Remolque de planeador",
  INSTRUCCION: "Instrucción",
  NAVEGACION: "Navegación",
  FOTOGRAFIA: "Fotografía",
  CONTROL_FAUNA: "Control de fauna",
  TRANSPORTE_SANITARIO: "Transporte aéreo sanitario",
  EVACUACION_MEDICA: "Evacuación médica",
  PUBLICIDAD: "Publicidad",
  OFF_SHORE: "Off shore",
  CONTRA_INCENDIO: "Contra incendio",
};

// En el orden en que se muestran en el desplegable (el del enum).
export const TIPOS_VUELO = Object.values(TipoVuelo);
