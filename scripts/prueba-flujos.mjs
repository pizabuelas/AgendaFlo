/**
 * Prueba funcional de los flujos principales de AgendaFlow.
 *
 * Ejecuta, contra un servidor en marcha, el recorrido completo de un usuario
 * nuevo y del administrador:
 *
 *   1. Registro de un usuario nuevo
 *   2. Búsqueda y filtrado del catálogo
 *   3. Disponibilidad, reserva y cancelación de una cita
 *   4. Gestión de la cita desde el panel de administración
 *   5. Alta, edición y baja de servicios
 *   6. Envío del formulario de contacto
 *   7. Cierre de sesión y revocación del token
 *
 * Uso:  node scripts/prueba-flujos.mjs [urlBase]
 */
const urlBase = process.argv[2] ?? "http://localhost:3000";

let fallos = 0;
let pruebas = 0;

function comprobar(descripcion, condicion, detalle = "") {
  pruebas += 1;
  if (condicion) {
    console.log(`✓ ${descripcion}`);
  } else {
    fallos += 1;
    console.log(`✗ ${descripcion}${detalle ? `  → ${detalle}` : ""}`);
  }
}

async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(`${urlBase}${ruta}`, {
    ...opciones,
    headers: {
      ...(opciones.cuerpo ? { "Content-Type": "application/json" } : {}),
      ...(opciones.cookie ? { Cookie: opciones.cookie } : {}),
      ...opciones.headers,
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    redirect: "manual",
  });

  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  return { estado: respuesta.status, cuerpo, cookie: respuesta.headers.get("set-cookie") };
}

const correo = `prueba.${Date.now()}@agendaflow.dev`;
const contrasena = "Prueba2026";

/* -------------------------------------------------------------------------- */
/* 1 · Registro                                                                */
/* -------------------------------------------------------------------------- */

const registro = await peticion("/api/auth/registro", {
  method: "POST",
  cuerpo: {
    nombre: "Usuario de Prueba",
    email: correo,
    password: contrasena,
    confirmPassword: contrasena,
    aceptarTerminos: true,
  },
});

comprobar("1.1 El registro devuelve 201", registro.estado === 201, `estado ${registro.estado}`);
comprobar(
  "1.2 El registro devuelve la cookie de sesión",
  Boolean(registro.cookie?.includes("agendaflow_sesion")),
);

const cookieUsuario = /agendaflow_sesion=([^;]+)/.exec(registro.cookie ?? "")?.[1];
comprobar("1.3 La cookie contiene el token", Boolean(cookieUsuario));

const registroDuplicado = await peticion("/api/auth/registro", {
  method: "POST",
  cuerpo: {
    nombre: "Usuario de Prueba",
    email: correo,
    password: contrasena,
    confirmPassword: contrasena,
    aceptarTerminos: true,
  },
});
comprobar(
  "1.4 Un correo duplicado devuelve 409",
  registroDuplicado.estado === 409,
  `estado ${registroDuplicado.estado}`,
);

const registroInvalido = await peticion("/api/auth/registro", {
  method: "POST",
  cuerpo: { nombre: "A", email: "no-es-un-correo", password: "corta" },
});
comprobar(
  "1.5 Datos inválidos devuelven 400 con el detalle por campo",
  registroInvalido.estado === 400 && Boolean(registroInvalido.cuerpo?.errores),
  `estado ${registroInvalido.estado}`,
);

/* -------------------------------------------------------------------------- */
/* 2 · Catálogo: búsqueda y filtros                                            */
/* -------------------------------------------------------------------------- */

const catalogo = await peticion("/api/servicios?porPagina=48");
const totalServicios = catalogo.cuerpo?.datos?.total ?? 0;
comprobar("2.1 El catálogo devuelve servicios", totalServicios > 0, `total ${totalServicios}`);

const porPrecio = await peticion("/api/servicios?precio=50-100&porPagina=48");
const precios = (porPrecio.cuerpo?.datos?.servicios ?? []).map((s) => s.precio);
comprobar(
  "2.2 El filtro de precio acota los resultados",
  precios.length > 0 && precios.every((p) => p >= 50 && p <= 100),
  `precios ${precios.join(", ")}`,
);

const porCategoria = await peticion("/api/servicios?categoria=formacion&porPagina=48");
comprobar(
  "2.3 El filtro de categoría acota los resultados",
  (porCategoria.cuerpo?.datos?.servicios ?? []).every(
    (s) => s.categoria.slug === "formacion",
  ),
);

const combinado = await peticion("/api/servicios?q=a&categoria=formacion&precio=100-200&porPagina=48");
comprobar(
  "2.4 Los filtros se combinan entre sí",
  combinado.estado === 200,
  `estado ${combinado.estado}`,
);

const ordenDesc = await peticion("/api/servicios?orden=precio-desc&porPagina=48");
const ordenPrecios = (ordenDesc.cuerpo?.datos?.servicios ?? []).map((s) => s.precio);
comprobar(
  "2.5 La ordenación por precio descendente es correcta",
  ordenPrecios.every((p, i) => i === 0 || ordenPrecios[i - 1] >= p),
);

const ordenInvalido = await peticion("/api/servicios?orden=inventado");
comprobar(
  "2.6 Un orden no válido devuelve 400",
  ordenInvalido.estado === 400,
  `estado ${ordenInvalido.estado}`,
);

/* -------------------------------------------------------------------------- */
/* 3 · Disponibilidad y reserva                                                 */
/* -------------------------------------------------------------------------- */

const servicios = catalogo.cuerpo?.datos?.servicios ?? [];
const servicio = servicios.find((s) => s.horarios?.length > 0) ?? servicios[0];
comprobar("3.1 Hay un servicio con horarios", Boolean(servicio));

const fecha = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const disponibilidad = await peticion(
  `/api/disponibilidad?servicioId=${servicio.id}&fecha=${fecha}`,
);
comprobar(
  "3.2 La disponibilidad responde 200",
  disponibilidad.estado === 200,
  `estado ${disponibilidad.estado}`,
);

const huecos = disponibilidad.cuerpo?.datos?.huecos ?? [];
comprobar("3.3 Se calculan huecos para la fecha", huecos.length > 0, `${huecos.length} huecos`);

const huecoLibre = huecos.find((h) => h.disponible);
comprobar("3.4 Hay al menos un hueco libre", Boolean(huecoLibre));

const reserva = await peticion("/api/reservas", {
  method: "POST",
  cookie: `agendaflow_sesion=${cookieUsuario}`,
  cuerpo: { servicioId: servicio.id, fecha, hora: huecoLibre.hora, notas: "Reserva de prueba" },
});
comprobar("3.5 La reserva se crea", reserva.estado === 200, `estado ${reserva.estado}`);
comprobar(
  "3.6 La reserva devuelve un código legible",
  /^CIT-/.test(reserva.cuerpo?.datos?.codigo ?? ""),
  reserva.cuerpo?.datos?.codigo,
);

const idReserva = reserva.cuerpo?.datos?.id;

const reservaDuplicada = await peticion("/api/reservas", {
  method: "POST",
  cookie: `agendaflow_sesion=${cookieUsuario}`,
  cuerpo: { servicioId: servicio.id, fecha, hora: huecoLibre.hora },
});
comprobar(
  "3.7 Reservar el mismo hueco otra vez se rechaza",
  [409, 422].includes(reservaDuplicada.estado),
  `estado ${reservaDuplicada.estado}`,
);

const misReservas = await peticion("/api/reservas", { cookie: `agendaflow_sesion=${cookieUsuario}` });
comprobar(
  "3.8 La cita aparece en el área personal",
  (misReservas.cuerpo?.datos?.reservas ?? []).some((r) => r.id === idReserva),
);

const notificaciones = await peticion("/api/notificaciones", {
  cookie: `agendaflow_sesion=${cookieUsuario}`,
});
comprobar(
  "3.9 Se genera una notificación al reservar",
  (notificaciones.cuerpo?.datos ?? []).length > 0,
);

/* El usuario cancela su cita y el hueco vuelve a quedar libre. */
const cancelar = await peticion(`/api/reservas/${idReserva}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieUsuario}`,
  cuerpo: { estado: "CANCELADA", motivoCancelacion: "Cambio de planes" },
});
comprobar(
  "3.10 El usuario cancela su propia cita",
  cancelar.estado === 200,
  `estado ${cancelar.estado}`,
);

const disponibilidadTrasCancelar = await peticion(
  `/api/disponibilidad?servicioId=${servicio.id}&fecha=${fecha}`,
);
const huecoLiberado = (disponibilidadTrasCancelar.cuerpo?.datos?.huecos ?? []).find(
  (h) => h.hora === huecoLibre.hora,
);
comprobar(
  "3.11 El hueco cancelado vuelve a estar disponible",
  huecoLiberado?.disponible === true,
  JSON.stringify(huecoLiberado),
);

const reservaLiberada = await peticion("/api/reservas", {
  method: "POST",
  cookie: `agendaflow_sesion=${cookieUsuario}`,
  cuerpo: { servicioId: servicio.id, fecha, hora: huecoLibre.hora },
});
comprobar(
  "3.12 Se puede volver a reservar el hueco liberado",
  reservaLiberada.estado === 200,
  `estado ${reservaLiberada.estado}`,
);

const idReservaActiva = reservaLiberada.cuerpo?.datos?.id;

/* -------------------------------------------------------------------------- */
/* 4 · Panel de administración                                                  */
/* -------------------------------------------------------------------------- */

const accesoIndenegado = await peticion("/api/admin/usuarios", {
  cookie: `agendaflow_sesion=${cookieUsuario}`,
});
comprobar(
  "4.1 Un usuario estándar no puede listar usuarios",
  accesoIndenegado.estado === 403,
  `estado ${accesoIndenegado.estado}`,
);

const loginAdmin = await peticion("/api/auth/login", {
  method: "POST",
  cuerpo: { email: "admin@agendaflow.dev", password: "Admin1234" },
});
comprobar("4.2 El administrador inicia sesión", loginAdmin.estado === 200);
const cookieAdmin = /agendaflow_sesion=([^;]+)/.exec(loginAdmin.cookie ?? "")?.[1];

const listarUsuarios = await peticion("/api/admin/usuarios", {
  cookie: `agendaflow_sesion=${cookieAdmin}`,
});
comprobar("4.3 El administrador sí puede listar usuarios", listarUsuarios.estado === 200);

const confirmar = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: { estado: "CONFIRMADA" },
});
comprobar("4.4 El administrador confirma la cita", confirmar.estado === 200, `estado ${confirmar.estado}`);

const retroceder = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: { estado: "PENDIENTE" },
});
comprobar(
  "4.5 Una cita confirmada no puede volver a pendiente",
  retroceder.estado === 422,
  `estado ${retroceder.estado}`,
);

const repetir = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: { estado: "CONFIRMADA" },
});
comprobar(
  "4.6 Repetir el mismo estado es idempotente",
  repetir.estado === 200,
  `estado ${repetir.estado}`,
);

const completar = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: { estado: "COMPLETADA" },
});
comprobar("4.7 La cita pasa a completada", completar.estado === 200, `estado ${completar.estado}`);

const transicionInvalida = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: { estado: "PENDIENTE" },
});
comprobar(
  "4.8 Una cita completada es un estado terminal",
  transicionInvalida.estado === 422,
  `estado ${transicionInvalida.estado}`,
);

const cancelarCompletada = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: { estado: "CANCELADA" },
});
comprobar(
  "4.9 Una cita completada no se puede cancelar",
  cancelarCompletada.estado === 422,
  `estado ${cancelarCompletada.estado}`,
);

const eliminar = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "DELETE",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
});
comprobar("4.10 El administrador elimina la cita", eliminar.estado === 200, `estado ${eliminar.estado}`);

const borrarComoUsuario = await peticion(`/api/reservas/${idReservaActiva}`, {
  method: "DELETE",
  cookie: `agendaflow_sesion=${cookieUsuario}`,
});
comprobar(
  "4.11 Un usuario no puede borrar citas ajenas",
  [401, 403, 404].includes(borrarComoUsuario.estado),
  `estado ${borrarComoUsuario.estado}`,
);

/* -------------------------------------------------------------------------- */
/* 5 · Gestión de servicios                                                    */
/* -------------------------------------------------------------------------- */

const crearServicio = await peticion("/api/servicios", {
  method: "POST",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: {
    nombre: `Servicio de prueba ${Date.now()}`,
    descripcion: "Servicio creado por la prueba automática de flujos del sistema.",
    categoriaId: catalogo.cuerpo?.datos?.servicios?.[0]?.categoriaId,
    precio: 42,
    duracionMin: 30,
    horarios: [{ diaSemana: 3, horaInicio: "10:00", horaFin: "12:00" }],
  },
});
comprobar("5.1 El administrador crea un servicio", crearServicio.estado === 201, `estado ${crearServicio.estado}`);

const idServicio = crearServicio.cuerpo?.datos?.id;

const editarServicio = await peticion(`/api/servicios/${idServicio}`, {
  method: "PATCH",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
  cuerpo: { precio: 55 },
});
comprobar("5.2 El servicio se actualiza", editarServicio.estado === 200, `estado ${editarServicio.estado}`);

const bajaServicio = await peticion(`/api/servicios/${idServicio}`, {
  method: "DELETE",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
});
comprobar("5.3 El servicio se da de baja", bajaServicio.estado === 200, `estado ${bajaServicio.estado}`);

const reactivarServicio = await peticion(`/api/servicios/${idServicio}`, {
  method: "POST",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
});
comprobar("5.4 El servicio se reactiva", reactivarServicio.estado === 200, `estado ${reactivarServicio.estado}`);

const eliminarServicio = await peticion(`/api/servicios/${idServicio}?definitivo=true`, {
  method: "DELETE",
  cookie: `agendaflow_sesion=${cookieAdmin}`,
});
comprobar(
  "5.5 El servicio se elimina definitivamente",
  eliminarServicio.estado === 200,
  `estado ${eliminarServicio.estado}`,
);

const crearComoUsuario = await peticion("/api/servicios", {
  method: "POST",
  cookie: `agendaflow_sesion=${cookieUsuario}`,
  cuerpo: {
    nombre: "Intento no autorizado",
    descripcion: "Este servicio no debería llegar a crearse nunca en la prueba.",
    categoriaId: catalogo.cuerpo?.datos?.servicios?.[0]?.categoriaId,
    precio: 10,
    duracionMin: 30,
  },
});
comprobar(
  "5.6 Un usuario estándar no puede crear servicios",
  crearComoUsuario.estado === 403,
  `estado ${crearComoUsuario.estado}`,
);

/* -------------------------------------------------------------------------- */
/* 6 · Formulario de contacto                                                  */
/* -------------------------------------------------------------------------- */

const contacto = await peticion("/api/contacto", {
  method: "POST",
  cuerpo: {
    nombre: "Persona de Prueba",
    email: "prueba@agendaflow.dev",
    asunto: "Mensaje de prueba automática",
    mensaje: "Este mensaje se envía desde la prueba automática de flujos de AgendaFlow.",
  },
});
comprobar("6.1 El formulario de contacto acepta el mensaje", contacto.estado === 201, `estado ${contacto.estado}`);

const contactoInvalido = await peticion("/api/contacto", {
  method: "POST",
  cuerpo: { nombre: "A", email: "x", asunto: "c", mensaje: "corto" },
});
comprobar("6.2 El contacto valida los campos", contactoInvalido.estado === 400);

const honeypot = await peticion("/api/contacto", {
  method: "POST",
  cuerpo: {
    nombre: "Bot de Prueba",
    email: "bot@agendaflow.dev",
    asunto: "Mensaje de bot",
    mensaje: "Este mensaje llega con la trampa honeypot rellena y debe descartarse.",
    honeypot: "relleno",
  },
});
comprobar("6.3 El honeypot descarta el envío del bot", honeypot.estado === 201);

const honeypotInvalido = await peticion("/api/contacto", {
  method: "POST",
  cuerpo: { nombre: "A", email: "x", asunto: "c", mensaje: "corto", honeypot: "relleno" },
});
comprobar(
  "6.4 El honeypot se descarta aunque el resto sea inválido",
  honeypotInvalido.estado === 201,
  `estado ${honeypotInvalido.estado}`,
);

/* -------------------------------------------------------------------------- */
/* 7 · Cierre de sesión                                                        */
/* -------------------------------------------------------------------------- */

const logout = await peticion("/api/auth/logout", {
  method: "POST",
  cookie: `agendaflow_sesion=${cookieUsuario}`,
});
comprobar("7.1 El cierre de sesión responde 200", logout.estado === 200);

const sesionTrasLogout = await peticion("/api/auth/sesion", {
  cookie: `agendaflow_sesion=${cookieUsuario}`,
});
comprobar(
  "7.2 El token revocado ya no vale",
  sesionTrasLogout.estado === 401,
  `estado ${sesionTrasLogout.estado}`,
);

/* -------------------------------------------------------------------------- */

console.log(`\n${pruebas - fallos}/${pruebas} comprobaciones correctas.`);
if (fallos > 0) {
  console.log(`✗ ${fallos} comprobaciones fallidas`);
  process.exit(1);
}
console.log("✓ Todos los flujos funcionan correctamente");
