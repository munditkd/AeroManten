// Antes de borrar un registro, cada acción de "delete" cuenta cuántas filas
// de otras tablas todavía lo referencian y llama a esto. Si hay alguna,
// se corta el borrado con un mensaje que dice exactamente qué tablas lo usan.
export function verificarSinReferencias(
  referencias: { nombre: string; cantidad: number }[]
) {
  const conDatos = referencias.filter((r) => r.cantidad > 0);
  if (conDatos.length > 0) {
    const detalle = conDatos.map((r) => `${r.nombre} (${r.cantidad})`).join(", ");
    throw new Error(`No se puede eliminar: hay datos relacionados en ${detalle}.`);
  }
}
