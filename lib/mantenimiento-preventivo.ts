export type EstadoVencimientoMP =
  | "nunca-realizado"
  | "vencido"
  | "proximo"
  | "ok"
  | "sin-datos";

export interface FactorVencimiento {
  tipo: "horas" | "ciclos" | "meses";
  consumido: number;
  intervalo: number;
  restante: number;
  porcentaje: number;
}

export interface VencimientoMP {
  estado: EstadoVencimientoMP;
  // Usado para ordenar de más urgente a menos urgente (descendente).
  criticidad: number;
  factorCritico: FactorVencimiento | null;
  factores: FactorVencimiento[];
}

function diffMeses(desde: Date, hasta: Date): number {
  const meses =
    (hasta.getFullYear() - desde.getFullYear()) * 12 +
    (hasta.getMonth() - desde.getMonth()) -
    (hasta.getDate() < desde.getDate() ? 1 : 0);
  return Math.max(0, meses);
}

export function calcularVencimiento(params: {
  mp: { horas: number | null; ciclos: number | null; meses: number | null };
  activoHoras: number | null;
  activoCiclos: number | null;
  ultimaRealizacion: { fecha: Date; horas: number | null; ciclos: number | null } | null;
  hoy?: Date;
}): VencimientoMP {
  const { mp, activoHoras, activoCiclos, ultimaRealizacion } = params;
  const hoy = params.hoy ?? new Date();

  if (!ultimaRealizacion) {
    const aplica = mp.horas != null || mp.ciclos != null || mp.meses != null;
    return {
      estado: aplica ? "nunca-realizado" : "sin-datos",
      criticidad: aplica ? Infinity : -Infinity,
      factorCritico: null,
      factores: [],
    };
  }

  const factores: FactorVencimiento[] = [];

  if (mp.horas != null && mp.horas > 0 && activoHoras != null && ultimaRealizacion.horas != null) {
    const consumido = activoHoras - ultimaRealizacion.horas;
    factores.push({
      tipo: "horas",
      consumido,
      intervalo: mp.horas,
      restante: mp.horas - consumido,
      porcentaje: consumido / mp.horas,
    });
  }

  if (mp.ciclos != null && mp.ciclos > 0 && activoCiclos != null && ultimaRealizacion.ciclos != null) {
    const consumido = activoCiclos - ultimaRealizacion.ciclos;
    factores.push({
      tipo: "ciclos",
      consumido,
      intervalo: mp.ciclos,
      restante: mp.ciclos - consumido,
      porcentaje: consumido / mp.ciclos,
    });
  }

  if (mp.meses != null && mp.meses > 0) {
    const consumido = diffMeses(ultimaRealizacion.fecha, hoy);
    factores.push({
      tipo: "meses",
      consumido,
      intervalo: mp.meses,
      restante: mp.meses - consumido,
      porcentaje: consumido / mp.meses,
    });
  }

  if (factores.length === 0) {
    return { estado: "sin-datos", criticidad: -Infinity, factorCritico: null, factores: [] };
  }

  const factorCritico = factores.reduce((a, b) => (b.porcentaje > a.porcentaje ? b : a));
  const estado: EstadoVencimientoMP =
    factorCritico.porcentaje >= 1 ? "vencido" : factorCritico.porcentaje >= 0.8 ? "proximo" : "ok";

  return { estado, criticidad: factorCritico.porcentaje, factorCritico, factores };
}

export const ESTADO_LABEL: Record<EstadoVencimientoMP, string> = {
  "nunca-realizado": "Nunca realizado",
  vencido: "Vencido",
  proximo: "Próximo a vencer",
  ok: "Al día",
  "sin-datos": "Sin datos suficientes",
};

export const ESTADO_BADGE_CLASS: Record<EstadoVencimientoMP, string> = {
  "nunca-realizado": "bg-red-100 text-red-700",
  vencido: "bg-red-100 text-red-700",
  proximo: "bg-yellow-100 text-yellow-700",
  ok: "bg-green-100 text-green-700",
  "sin-datos": "bg-gris-100 text-gris-600",
};

const UNIDAD_LABEL: Record<FactorVencimiento["tipo"], string> = {
  horas: "h",
  ciclos: "cy",
  meses: "m",
};

export function formatFactor(factor: FactorVencimiento): string {
  const unidad = UNIDAD_LABEL[factor.tipo];
  const decimales = factor.tipo === "horas" ? 1 : 0;
  if (factor.restante >= 0) {
    return `${factor.restante.toFixed(decimales)} ${unidad} restantes`;
  }
  return `${Math.abs(factor.restante).toFixed(decimales)} ${unidad} vencido`;
}
