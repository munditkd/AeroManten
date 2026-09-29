// Catálogo curado de tablas y campos "de negocio" que se pueden auditar.
// Deliberadamente no incluye campos técnicos (id, createdAt, updatedAt,
// secuencia) ni tablas internas del sistema (usuarios, sesiones, grupos,
// estados). Agregar una tabla nueva acá alcanza para que aparezca en el
// desplegable de /admin/auditoria/campos y para que lib/auditoria-motor.ts
// sepa qué "delegate" de Prisma usar para leer sus valores.

export type CampoAuditable = { nombre: string; label: string };
export type TablaAuditable = {
  tabla: string; // nombre del modelo Prisma, tal cual lo usa la extensión
  label: string;
  delegate: string; // nombre del delegate en el cliente Prisma (ej. "activo")
  campos: CampoAuditable[];
};

export const TABLAS_AUDITABLES: TablaAuditable[] = [
  {
    tabla: "Propietario",
    label: "Propietarios",
    delegate: "propietario",
    campos: [
      { nombre: "nombre", label: "Nombre" },
      { nombre: "documento", label: "Documento" },
      { nombre: "telefono", label: "Teléfono" },
      { nombre: "email", label: "Email" },
      { nombre: "direccion", label: "Dirección" },
    ],
  },
  {
    tabla: "Aeronave",
    label: "Aeronaves",
    delegate: "aeronave",
    campos: [
      { nombre: "codigo", label: "Código" },
      { nombre: "matricula", label: "Matrícula" },
      { nombre: "marca", label: "Marca" },
      { nombre: "modelo", label: "Modelo" },
      { nombre: "numeroSerie", label: "Número de serie" },
      { nombre: "fechaFabricacion", label: "Fecha de fabricación" },
      { nombre: "horasTSN", label: "Horas TSN" },
      { nombre: "horasTSO", label: "Horas TSO" },
      { nombre: "ciclosTSN", label: "Ciclos TSN" },
      { nombre: "ciclosTSO", label: "Ciclos TSO" },
      { nombre: "mesesTSN", label: "Meses TSN" },
      { nombre: "mesesTSO", label: "Meses TSO" },
      { nombre: "propietarioId", label: "Propietario" },
      { nombre: "estadoId", label: "Estado" },
    ],
  },
  {
    tabla: "Activo",
    label: "Activos",
    delegate: "activo",
    campos: [
      { nombre: "codigo", label: "Código" },
      { nombre: "tipo", label: "Tipo" },
      { nombre: "marca", label: "Marca" },
      { nombre: "modelo", label: "Modelo" },
      { nombre: "numeroSerie", label: "Número de serie" },
      { nombre: "fechaFabricacion", label: "Fecha de fabricación" },
      { nombre: "horasTSN", label: "Horas TSN" },
      { nombre: "horasTSO", label: "Horas TSO" },
      { nombre: "ciclosTSN", label: "Ciclos TSN" },
      { nombre: "ciclosTSO", label: "Ciclos TSO" },
      { nombre: "mesesTSN", label: "Meses TSN" },
      { nombre: "mesesTSO", label: "Meses TSO" },
      { nombre: "aeronaveId", label: "Aeronave" },
      { nombre: "estadoId", label: "Estado" },
    ],
  },
  {
    tabla: "Personal",
    label: "Personal",
    delegate: "personal",
    campos: [
      { nombre: "nombre", label: "Nombre" },
      { nombre: "apellido", label: "Apellido" },
      { nombre: "dni", label: "DNI" },
      { nombre: "telefono", label: "Teléfono" },
      { nombre: "email", label: "Email" },
      { nombre: "fechaNacimiento", label: "Fecha de nacimiento" },
      { nombre: "legajo", label: "Legajo" },
      { nombre: "rol", label: "Rol" },
      { nombre: "habilitado", label: "Habilitado" },
      { nombre: "fechaInicioHabilitacion", label: "Inicio habilitación" },
      { nombre: "fechaVencimientoHabilitacion", label: "Vencimiento habilitación" },
      { nombre: "grupoId", label: "Grupo" },
    ],
  },
  {
    tabla: "OrdenTrabajo",
    label: "Órdenes de Trabajo",
    delegate: "ordenTrabajo",
    campos: [
      { nombre: "descripcion", label: "Descripción" },
      { nombre: "tipo", label: "Tipo" },
      { nombre: "clase", label: "Clase" },
      { nombre: "categoria", label: "Categoría" },
      { nombre: "fecha", label: "Fecha" },
      { nombre: "estadoId", label: "Estado" },
      { nombre: "departamento", label: "Departamento" },
      { nombre: "aeronaveId", label: "Aeronave" },
      { nombre: "activoId", label: "Activo" },
      { nombre: "mantenimientoPreventivoId", label: "Mantenimiento preventivo" },
      { nombre: "fechaInicio", label: "Fecha inicio" },
      { nombre: "fechaFinPlanificado", label: "Fecha fin planificado" },
      { nombre: "duracionEstimada", label: "Duración estimada" },
      { nombre: "duracionReal", label: "Duración real" },
      { nombre: "originadorId", label: "Originador" },
      { nombre: "responsableId", label: "Responsable" },
      { nombre: "prioridad", label: "Prioridad" },
      { nombre: "falla", label: "Falla" },
      { nombre: "fechaCerrado", label: "Fecha cerrado" },
      { nombre: "costo", label: "Costo" },
      { nombre: "hsTotales", label: "Hs totales" },
      { nombre: "comentarios", label: "Comentarios" },
    ],
  },
  {
    tabla: "OrdenTrabajoTarea",
    label: "Tareas de OT",
    delegate: "ordenTrabajoTarea",
    campos: [
      { nombre: "descripcion", label: "Descripción" },
      { nombre: "estadoId", label: "Estado" },
      { nombre: "personalId", label: "Operario" },
      { nombre: "fecha", label: "Fecha" },
      { nombre: "horas", label: "Horas" },
      { nombre: "costo", label: "Costo" },
      { nombre: "comentarios", label: "Comentarios" },
    ],
  },
  {
    tabla: "MantenimientoPreventivo",
    label: "Mantenimiento Preventivo",
    delegate: "mantenimientoPreventivo",
    campos: [
      { nombre: "codigo", label: "Código" },
      { nombre: "descripcion", label: "Descripción" },
      { nombre: "horas", label: "Horas" },
      { nombre: "ciclos", label: "Ciclos" },
      { nombre: "meses", label: "Meses" },
      { nombre: "tarea", label: "Tarea" },
      { nombre: "personas", label: "Personas" },
      { nombre: "horasHombre", label: "Horas-hombre" },
    ],
  },
  {
    tabla: "RegistroVuelo",
    label: "Vuelos",
    delegate: "registroVuelo",
    campos: [
      { nombre: "aeronaveId", label: "Aeronave" },
      { nombre: "pilotoId", label: "Piloto" },
      { nombre: "paisOrigen", label: "País origen" },
      { nombre: "aeropuertoOrigen", label: "Aeropuerto origen" },
      { nombre: "fechaOrigen", label: "Fecha origen" },
      { nombre: "horaOrigen", label: "Hora origen" },
      { nombre: "paisDestino", label: "País destino" },
      { nombre: "aeropuertoDestino", label: "Aeropuerto destino" },
      { nombre: "fechaDestino", label: "Fecha destino" },
      { nombre: "horaDestino", label: "Hora destino" },
      { nombre: "tiempoVuelo", label: "Tiempo de vuelo" },
      { nombre: "ciclos", label: "Ciclos" },
      { nombre: "observaciones", label: "Observaciones" },
    ],
  },
];

export function obtenerTablaAuditable(tabla: string): TablaAuditable | undefined {
  return TABLAS_AUDITABLES.find((t) => t.tabla === tabla);
}

export function obtenerCampoAuditable(
  tabla: string,
  campo: string
): CampoAuditable | undefined {
  return obtenerTablaAuditable(tabla)?.campos.find((c) => c.nombre === campo);
}

// Campos que son relación (guardan un ID) y cómo resolverlos a texto legible
// para el log de auditoría. "delegate" es el modelo relacionado, "campo" el
// que se usa como etiqueta (o una función si hace falta combinar más de uno).
export const RESOLVERS_FK: Record<
  string,
  { delegate: string; etiqueta: (row: Record<string, unknown>) => string }
> = {
  estadoId: { delegate: "estado", etiqueta: (r) => String(r.status ?? "") },
  propietarioId: { delegate: "propietario", etiqueta: (r) => String(r.nombre ?? "") },
  aeronaveId: { delegate: "aeronave", etiqueta: (r) => String(r.matricula ?? "") },
  activoId: { delegate: "activo", etiqueta: (r) => `Activo #${r.codigo ?? ""}` },
  mantenimientoPreventivoId: {
    delegate: "mantenimientoPreventivo",
    etiqueta: (r) => String(r.codigo ?? ""),
  },
  grupoId: { delegate: "grupo", etiqueta: (r) => String(r.codigo ?? "") },
  originadorId: {
    delegate: "personal",
    etiqueta: (r) => `${r.apellido ?? ""}, ${r.nombre ?? ""}`,
  },
  responsableId: {
    delegate: "personal",
    etiqueta: (r) => `${r.apellido ?? ""}, ${r.nombre ?? ""}`,
  },
  personalId: {
    delegate: "personal",
    etiqueta: (r) => `${r.apellido ?? ""}, ${r.nombre ?? ""}`,
  },
  pilotoId: {
    delegate: "personal",
    etiqueta: (r) => `${r.apellido ?? ""}, ${r.nombre ?? ""}`,
  },
};
