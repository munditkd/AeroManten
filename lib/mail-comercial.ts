import nodemailer from "nodemailer";
import { desencriptar } from "./credenciales";

type DatosSmtpComercial = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPasswordEncriptada: string | null;
  smtpSeguro: boolean;
};

// null = la casilla comercial todavía no tiene las credenciales SMTP
// completas (host, usuario y contraseña) cargadas y guardadas.
export function construirTransporterComercial(propietario: DatosSmtpComercial) {
  if (!propietario.smtpHost || !propietario.smtpUser || !propietario.smtpPasswordEncriptada) {
    return null;
  }

  return nodemailer.createTransport({
    host: propietario.smtpHost,
    port: propietario.smtpPort ?? 587,
    secure: propietario.smtpSeguro,
    auth: {
      user: propietario.smtpUser,
      pass: desencriptar(propietario.smtpPasswordEncriptada),
    },
  });
}
