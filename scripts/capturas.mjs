/**
 * Capturas de pantalla de la aplicación para el README.
 *
 * Lanza Chrome en modo headless con el protocolo de DevTools abierto, inicia
 * sesión con la cuenta de administrador (para poder capturar también el
 * panel privado) y guarda una imagen PNG de cada ruta indicada.
 *
 * Notas de consumo de memoria: se reutiliza una única pestaña para todas las
 * capturas (evita crear un proceso renderizador por cada imagen) y se libera
 * la memoria de Node entre capturas.
 *
 * Uso:  node --expose-gc scripts/capturas.mjs [urlBase] [carpetaDestino]
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const urlBase = process.argv[2] ?? "http://localhost:3000";
const destino = resolve(raiz, process.argv[3] ?? "docs/capturas");

const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const PUERTO = 9222;

/* -------------------------------------------------------------------------- */
/* Rutas a capturar                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Rutas a capturar. `sesion` indica con qué cuenta se abre la sesión para
 * esa captura (`admin` para el panel, `usuario` para el área personal).
 * Sin `sesion` la página se captura sin cookie, tal y como la ve un visitante.
 */
const CAPTURAS = [
  { nombre: "01-portada", ruta: "/", ancho: 1440, alto: 900, altoMax: 1500 },
  { nombre: "02-catalogo", ruta: "/servicios", ancho: 1440, alto: 900, altoMax: 1500 },
  { nombre: "03-servicio", ruta: "/servicios/consulta-medica-general", ancho: 1440, alto: 900, altoMax: 1500 },
  { nombre: "04-como-funciona", ruta: "/como-funciona", ancho: 1440, alto: 900, altoMax: 1500 },
  { nombre: "05-registro", ruta: "/registro", ancho: 1440, alto: 900, altoMax: 1200 },
  { nombre: "06-login", ruta: "/login", ancho: 1440, alto: 900, altoMax: 1200 },
  { nombre: "07-contacto", ruta: "/contacto", ancho: 1440, alto: 900, altoMax: 1400 },
  { nombre: "08-mis-citas", ruta: "/mis-reservas", ancho: 1440, alto: 900, altoMax: 1300, sesion: "usuario" },
  { nombre: "09-admin-resumen", ruta: "/admin", ancho: 1440, alto: 900, altoMax: 1400, sesion: "admin" },
  { nombre: "10-admin-servicios", ruta: "/admin/servicios", ancho: 1440, alto: 900, altoMax: 1400, sesion: "admin" },
  { nombre: "11-admin-reservas", ruta: "/admin/reservas", ancho: 1440, alto: 900, altoMax: 1400, sesion: "admin" },
  { nombre: "12-admin-usuarios", ruta: "/admin/usuarios", ancho: 1440, alto: 900, altoMax: 1400, sesion: "admin" },
  { nombre: "13-movil-portada", ruta: "/", ancho: 390, alto: 844, altoMax: 1100 },
  { nombre: "14-movil-catalogo", ruta: "/servicios", ancho: 390, alto: 844, altoMax: 1100 },
  { nombre: "15-movil-mis-citas", ruta: "/mis-reservas", ancho: 390, alto: 844, altoMax: 1100, sesion: "usuario" },
  { nombre: "16-portada-oscuro", ruta: "/", ancho: 1440, alto: 900, altoMax: 1500, tema: "oscuro" },
  { nombre: "17-admin-oscuro", ruta: "/admin", ancho: 1440, alto: 900, altoMax: 1400, tema: "oscuro", sesion: "admin" },
];

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

function liberarMemoria() {
  if (typeof globalThis.gc === "function") globalThis.gc();
}

async function esperarUntil(predicado, intentos = 60, pausa = 250) {
  for (let i = 0; i < intentos; i += 1) {
    const valor = await predicado();
    if (valor) return valor;
    await esperar(pausa);
  }
  return null;
}

/** Cliente mínimo del protocolo de DevTools sobre WebSocket. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pendientes = new Map();
    this.oyentes = new Map();

    ws.addEventListener("message", (evento) => {
      const mensaje = JSON.parse(evento.data);

      if (mensaje.id && this.pendientes.has(mensaje.id)) {
        const { resolver, rechazar } = this.pendientes.get(mensaje.id);
        this.pendientes.delete(mensaje.id);
        if (mensaje.error) rechazar(new Error(mensaje.error.message));
        else resolver(mensaje.result);
        return;
      }

      const oyentes = this.oyentes.get(mensaje.method);
      if (oyentes) {
        for (const oyente of oyentes) oyente(mensaje.params);
      }
    });
  }

  enviar(method, params = {}) {
    this.id += 1;
    const id = this.id;

    return new Promise((resolver, rechazar) => {
      this.pendientes.set(id, { resolver, rechazar });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  al(evento, callback) {
    if (!this.oyentes.has(evento)) this.oyentes.set(evento, []);
    this.oyentes.get(evento).push(callback);
  }

  cerrar() {
    this.ws.close();
  }
}

/* -------------------------------------------------------------------------- */
/* Proceso principal                                                           */
/* -------------------------------------------------------------------------- */

/** Cuentas de demostración sembradas por `prisma/seed.ts`. */
const CUENTAS = {
  admin: { email: "admin@agendaflow.dev", password: "Admin1234" },
  usuario: { email: "usuario@agendaflow.dev", password: "Usuario1234" },
};

async function iniciarSesion(cuenta) {
  const credenciales = CUENTAS[cuenta];
  if (!credenciales) throw new Error(`Cuenta desconocida: ${cuenta}`);

  const respuesta = await fetch(`${urlBase}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credenciales),
  });

  if (!respuesta.ok) {
    throw new Error(`No se pudo iniciar sesión (${respuesta.status}).`);
  }

  const cabecera = respuesta.headers.get("set-cookie") ?? "";
  const valor = /agendaflow_sesion=([^;]+)/.exec(cabecera)?.[1];

  if (!valor) throw new Error("La respuesta de login no incluye la cookie de sesión.");

  return valor;
}

async function main() {
  mkdirSync(destino, { recursive: true });

  const perfil = join(tmpdir(), "agendaflow-capturas");
  rmSync(perfil, { recursive: true, force: true });

  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PUERTO}`,
      `--user-data-dir=${perfil}`,
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-sync",
      "--renderer-process-limit=1",
      "--force-device-scale-factor=1",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let objetivo;

  try {
    const version = await esperarUntil(async () => {
      try {
        const r = await fetch(`http://127.0.0.1:${PUERTO}/json/version`);
        return r.ok ? await r.json() : null;
      } catch {
        return null;
      }
    });

    if (!version) throw new Error("Chrome no respondió en el puerto de depuración.");

    const cookies = {
      admin: await iniciarSesion("admin"),
      usuario: await iniciarSesion("usuario"),
    };

    // Una sola pestaña para todas las capturas: evita multiplicar los procesos
    // de renderizado (principal causa de agotamiento de memoria).
    objetivo = await fetch(`http://127.0.0.1:${PUERTO}/json/new?about:blank`, {
      method: "PUT",
    }).then((r) => r.json());

    const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
    await new Promise((resolver, rechazar) => {
      ws.addEventListener("open", resolver, { once: true });
      ws.addEventListener("error", rechazar, { once: true });
    });

    const cdp = new Cdp(ws);

    await cdp.enviar("Page.enable");
    await cdp.enviar("Network.enable");
    await cdp.enviar("Network.setCacheDisabled", { cacheDisabled: true });

    for (const captura of CAPTURAS) {
      await cdp.enviar("Emulation.setDeviceMetricsOverride", {
        width: captura.ancho,
        height: captura.alto,
        deviceScaleFactor: 1,
        mobile: captura.ancho < 600,
      });

      // Fuerza el tema del sistema para que las capturas sean consistentes
      // (el headless de Chrome no aplica la preferencia del sistema real).
      await cdp.enviar("Emulation.setEmulatedMedia", {
        media: "screen",
        features: [
          {
            name: "prefers-color-scheme",
            value: captura.tema === "oscuro" ? "dark" : "light",
          },
        ],
      });

      if (captura.sesion) {
        await cdp.enviar("Network.setCookie", {
          name: "agendaflow_sesion",
          value: cookies[captura.sesion],
          url: urlBase,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        });
      } else {
        await cdp.enviar("Network.deleteCookies", {
          name: "agendaflow_sesion",
          url: urlBase,
        });
      }

      const cargado = new Promise((resolver) => cdp.al("Page.loadEventFired", resolver));
      await cdp.enviar("Page.navigate", { url: `${urlBase}${captura.ruta}` });
      await Promise.race([cargado, esperar(15000)]);
      await esperar(1500);

      // Alto real del documento, acotado para no generar imágenes enormes.
      let alto = captura.alto;
      try {
        const metricas = await cdp.enviar("Page.getLayoutMetrics");
        const contenido = metricas.cssContentSize ?? metricas.contentSize;
        alto = Math.min(Math.ceil(contenido.height), captura.altoMax ?? captura.alto);
      } catch {
        /* se usa la altura del viewport */
      }

      const archivo = join(destino, `${captura.nombre}.png`);

      let data;
      try {
        ({ data } = await cdp.enviar("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: captura.ancho, height: alto, scale: 1 },
        }));
      } catch {
        /* Algunas versiones de Chrome rechazan el recorte fuera del viewport:
         * se recurre a la altura visible. */
        ({ data } = await cdp.enviar("Page.captureScreenshot", { format: "png" }));
      }

      const buffer = Buffer.from(data, "base64");
      writeFileSync(archivo, buffer);
      console.log(
        `✓ ${captura.nombre}.png (${captura.ancho}x${alto}, ${Math.round(buffer.length / 1024)} kB)`,
      );

      data = null;
      liberarMemoria();
      await esperar(300);
    }

    cdp.cerrar();
  } finally {
    chrome.kill();
    if (objetivo?.id) {
      await fetch(`http://127.0.0.1:${PUERTO}/json/close/${objetivo.id}`).catch(() => {});
    }
  }
}

main().catch((error) => {
  console.error("✗ No se pudieron generar las capturas:", error.message);
  process.exit(1);
});
