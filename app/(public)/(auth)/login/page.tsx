import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

// Si ya hay una sesión válida (ej. se reconectó pero el header ya lo muestra
// conectado), no tiene sentido mostrar el formulario — se manda directo al
// panel. Evita quedar viendo el login con la sesión ya activa.
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  return <LoginForm />;
}
