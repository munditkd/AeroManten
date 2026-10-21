import crypto from "crypto";

const ALGORITMO = "aes-256-gcm";

// La clave de encriptación nunca se guarda en la base de datos ni se expone
// al navegador — vive solo en la variable de entorno del servidor (ver
// .env.example). Se hashea a 32 bytes para no depender de que el secreto
// tenga exactamente ese largo.
function obtenerClave(): Buffer {
  const secreto = process.env.CREDENCIALES_SECRET;
  if (!secreto) {
    throw new Error("Falta configurar CREDENCIALES_SECRET en el servidor");
  }
  return crypto.createHash("sha256").update(secreto).digest();
}

// Formato guardado: base64(iv [12 bytes] + authTag [16 bytes] + texto cifrado).
export function encriptar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerClave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, cifrado]).toString("base64");
}

export function desencriptar(valor: string): string {
  const datos = Buffer.from(valor, "base64");
  const iv = datos.subarray(0, 12);
  const tag = datos.subarray(12, 28);
  const cifrado = datos.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITMO, obtenerClave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
}
