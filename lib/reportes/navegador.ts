import puppeteer, { type Browser } from "puppeteer";

// Una sola instancia de Chromium reutilizada entre reportes (evita pagar
// ~1-2s de arranque en cada descarga). Si se desconecta (crash, kill
// externo), se relanza sola en el próximo pedido.
let navegadorPromise: Promise<Browser> | null = null;

async function lanzarNavegador(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export async function obtenerNavegador(): Promise<Browser> {
  if (!navegadorPromise) {
    navegadorPromise = lanzarNavegador();
  }
  const navegador = await navegadorPromise;
  if (!navegador.connected) {
    navegadorPromise = lanzarNavegador();
    return navegadorPromise;
  }
  return navegador;
}

export async function renderizarHtml(html: string) {
  const navegador = await obtenerNavegador();
  const pagina = await navegador.newPage();
  try {
    await pagina.setContent(html, { waitUntil: "load" });
    return pagina;
  } catch (error) {
    await pagina.close();
    throw error;
  }
}
