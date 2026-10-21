"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const searchParams = useSearchParams();
  const desconectadoPorInactividad = searchParams.get("motivo") === "inactividad";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Email/usuario o contraseña incorrectos");
      return;
    }

    // Navegación dura (no router.push) para que la sesión nueva se refleje
    // siempre con una carga fresca del lado del servidor — evita que el
    // router cache del cliente deje ver una mezcla de vistas (ej. el
    // encabezado ya conectado pero el formulario de login todavía en
    // pantalla) después de reconectar tras un cierre por inactividad.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin";
  }

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresá tus credenciales para continuar
          </p>
        </div>

        {desconectadoPorInactividad && (
          <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Se cerró tu sesión por inactividad. Volvé a ingresar.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email o usuario
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-gray-500 underline hover:text-gray-700"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-gray-900 underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
