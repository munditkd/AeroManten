import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Respondemos success siempre, exista o no el usuario,
    // para no filtrar qué emails están registrados.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        },
      });

      try {
        await sendPasswordResetEmail(email, token);
      } catch (mailError) {
        console.error("Error enviando email de recuperación:", mailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
