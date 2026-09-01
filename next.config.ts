import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Este hosting compartido tiene un límite muy bajo de procesos/threads;
    // reduce al mínimo los workers paralelos que usa el build.
    cpus: 1,
  },
};

export default nextConfig;
