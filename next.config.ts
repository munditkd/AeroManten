import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Este hosting compartido tiene un límite muy bajo de procesos/threads;
    // reduce al mínimo los workers paralelos que usa el build.
    cpus: 1,
    // Por defecto, Next.js genera las páginas en el build usando procesos
    // hijos (fork) que se comunican por socket. En este hosting, "forkear"
    // procesos nuevos es exactamente lo que se cuelga bajo carga (mismo
    // síntoma que tuvimos con el schema-engine de Prisma). workerThreads
    // usa threads dentro del mismo proceso en vez de procesos del SO, lo
    // que evita ese fork problemático.
    workerThreads: true,
  },
};

export default nextConfig;
