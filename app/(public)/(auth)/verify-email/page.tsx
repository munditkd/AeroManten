"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => (res.ok ? setStatus("success") : setStatus("error")))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {status === "loading" && (
          <p className="text-gray-600">Verificando tu email...</p>
        )}
        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">
              ¡Email verificado!
            </h1>
            <p className="text-sm text-gray-500">Ya podés iniciar sesión.</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">
              Enlace inválido
            </h1>
            <p className="text-sm text-gray-500">
              El enlace expiró o ya fue usado.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
