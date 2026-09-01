import { signOut } from "@/lib/auth";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server";
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
