/**
 * Verificación por HTTP de las páginas clave de la aplicación.
 * Uso: node scripts/verificar.mjs [urlBase]
 */
const urlBase = process.argv[2] ?? "http://localhost:3000";

const respuesta = await fetch(`${urlBase}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@agendaflow.dev", password: "Admin1234" }),
});

if (!respuesta.ok) {
  console.error(`✗ Login falló (${respuesta.status})`);
  process.exit(1);
}

const cookie = /agendaflow_sesion=([^;]+)/.exec(respuesta.headers.get("set-cookie"))?.[1];
const cabeceras = { Cookie: `agendaflow_sesion=${cookie}` };

const COMPROBACIONES = [
  { ruta: "/", markers: ["Reserva", "servicio"], privada: false },
  { ruta: "/servicios", markers: ["Asesoría estratégica", "precio"], privada: false },
  { ruta: "/servicios/consulta-medica-general", markers: ["Consult"], privada: false },
  { ruta: "/como-funciona", markers: ["Cómo funciona"], privada: false },
  { ruta: "/registro", markers: ["Crear", "email"], privada: false },
  { ruta: "/login", markers: ["Iniciar sesión", "Contraseña"], privada: false },
  { ruta: "/contacto", markers: ["Contacto", "mensaje"], privada: false },
  { ruta: "/mis-reservas", markers: ["cita", "reserva"], privada: true },
  { ruta: "/admin", markers: ["panel", "Reservas"], privada: true },
  { ruta: "/admin/servicios", markers: ["Asesoría estratégica", "Destacado"], privada: true },
  { ruta: "/admin/reservas", markers: ["Reservas", "Confirm"], privada: true },
  { ruta: "/admin/usuarios", markers: ["Usuarios", "Administrador"], privada: true },
  { ruta: "/accesibilidad", markers: ["accesib"], privada: false },
  { ruta: "/legal/privacidad", markers: ["privacidad", "datos"], privada: false },
];

let fallos = 0;

for (const prueba of COMPROBACIONES) {
  const r = await fetch(`${urlBase}${prueba.ruta}`, {
    headers: prueba.privada ? cabeceras : {},
    redirect: "manual",
  });

  const html = await r.text();
  const esLogin = html.includes('name="password"') && !html.includes("AgendaFlow");

  const faltantes = prueba.markers.filter((m) => !html.includes(m));

  const ok = r.status === 200 && faltantes.length === 0;
  if (!ok) fallos += 1;

  console.log(
    `${ok ? "✓" : "✗"} ${prueba.ruta.padEnd(38)} ${r.status} ${html.length} bytes` +
      (faltantes.length ? `  FALTA: ${faltantes.join(", ")}` : "") +
      (esLogin ? "  [parece login]" : ""),
  );
}

// Comprobación de APIs
console.log("\n--- APIs ---");

const servicios = await (
  await fetch(`${urlBase}/api/servicios?limite=3`, { headers: cabeceras })
).json();
const servicioId = servicios?.datos?.servicios?.[0]?.id;
const fecha = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const apis = [
  ["/api/servicios?limite=3", true],
  ["/api/disponibilidad", false],
  [`/api/disponibilidad?servicioId=${servicioId}&fecha=${fecha}`, true],
  ["/api/notificaciones", true],
  ["/api/auth/sesion", true],
  ["/api/reservas", true],
];

for (const [ruta, esperadoOk] of apis) {
  const r = await fetch(`${urlBase}${ruta}`, { headers: cabeceras });
  const ok = r.ok === esperadoOk;
  if (!ok) fallos += 1;
  console.log(`${ok ? "✓" : "✗"} ${ruta.padEnd(46)} ${r.status}`);
}

console.log(fallos === 0 ? "\n✓ Todo correcto" : `\n✗ ${fallos} comprobaciones fallidas`);
process.exit(fallos === 0 ? 0 : 1);
