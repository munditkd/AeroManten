import { unstable_rethrow } from "next/navigation";

export type EstadoAccion = { error: string | null };

// IMPORTANTE: en producción, Next.js borra el mensaje de cualquier error que
// un Server Action deja escapar (thrown) y lo reemplaza por un hash de
// seguridad ("digest") antes de mandarlo al cliente. Si ese valor redactado
// se intenta usar del lado del cliente como estado de useActionState, React
// termina tirando un error interno indescifrable (ej. "Minified React error
// #441") en vez de mostrar nuestro mensaje.
//
// La solución (recomendada por Next.js): el error se atrapa ACÁ, del lado
// del servidor, y se devuelve como un valor normal — nunca se deja escapar
// del Server Action. Un valor de retorno no se redacta, solo lo que se
// lanza (throw). redirect()/notFound() siguen funcionando: unstable_rethrow
// los deja pasar sin tocarlos.
export async function ejecutarAccion(fn: () => Promise<void>): Promise<EstadoAccion> {
  try {
    await fn();
    return { error: null };
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof Error ? error.message : "Ocurrió un error inesperado." };
  }
}
