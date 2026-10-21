import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { crearNotificacion } from "@/lib/services/notificaciones";
import { crearSesion } from "@/lib/session";
import { esquemaRegistro } from "@/lib/validators";
import { conflicto, creado, errorValidacion } from "@/lib/api-response";
import { permitirIntento, segundosRestantes } from "@/lib/rate-limit";

/**
 * RF-01 — Registro de nuevos usuarios.
 * Valida el correo, comprueba la complejidad de la contraseña y la almacena
 * con hashing bcrypt (RNF-03).
 */
export async function POST(request: NextRequest) {
  const direccionIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "desconocida";

  if (!permitirIntento(`registro:${direccionIp}`)) {
    return errorValidacion(
      `Demasiados intentos de registro. Vuelve a probar en ${Math.ceil(
        segundosRestantes(`registro:${direccionIp}`) / 60,
      )} minutos.`,
    );
  }

  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaRegistro.safeParse(cuerpo);
  if (!validacion.success) {
    return errorValidacion(
      "Revisa los datos del formulario.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const datos = validacion.data;

  if (datos.password !== datos.confirmPassword) {
    return errorValidacion("Las contraseñas no coinciden.", {
      confirmPassword: ["Las contraseñas no coinciden."],
    });
  }

  const existente = await prisma.usuario.findUnique({
    where: { email: datos.email },
    select: { id: true },
  });

  if (existente) {
    return conflicto("Ya existe una cuenta registrada con ese correo electrónico.");
  }

  const passwordHash = await hashPassword(datos.password);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      email: datos.email,
      passwordHash,
      telefono: datos.telefono || null,
      rol: "USUARIO",
    },
    select: { id: true, nombre: true, email: true, rol: true },
  });

  await crearSesion({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol === "ADMIN" ? "ADMIN" : "USUARIO",
  });

  await crearNotificacion({
    usuarioId: usuario.id,
    titulo: "¡Bienvenido a AgendaFlow!",
    mensaje: "Tu cuenta se ha creado correctamente. Ya puedes reservar tu primera cita.",
    tipo: "EXITO",
  });

  return creado(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    "¡Cuenta creada correctamente!",
  );
}
