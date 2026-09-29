import { auth, signOut } from "@/lib/auth";
import { registrarLogout } from "@/lib/auditoria-accesos";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const session = await auth();
        if (session?.user) {
          await registrarLogout(session.user.name || session.user.email || null);
        }
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className={className ?? "text-sm font-medium text-gris-600 hover:text-celeste-700"}
      >
        Cerrar sesión
      </button>
    </form>
  );
}
