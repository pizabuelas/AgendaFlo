import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { limpiarIntentos, permitirIntento, segundosRestantes } from "@/lib/rate-limit";
import { crearSesion } from "@/lib/session";
import { esquemaLogin } from "@/lib/validators";
import { errorValidacion, noAutorizado, ok } from "@/lib/api-response";

/**
 * RF-01 — Inicio de sesión.
 * El token JWT se entrega en una cookie `httpOnly`, de modo que nunca es
 * accesible desde JavaScript (protección frente a XSS).
 */
export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaLogin.safeParse(cuerpo);
  if (!validacion.success) {
    return errorValidacion(
      "Introduce un correo electrónico y una contraseña válidos.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const { email, password } = validacion.data;
  const clave = `login:${email}`;

  if (!permitirIntento(clave)) {
    const minutos = Math.ceil(segundosRestantes(clave) / 60);
    return noAutorizado(
      `Demasiados intentos fallidos. Vuelve a probar en ${minutos} minutos.`,
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      nombre: true,
      email: true,
      passwordHash: true,
      rol: true,
      activo: true,
    },
  });

  /* Mismo mensaje para usuario inexistente y contraseña incorrecta: no
   * revelamos qué correos están registrados. */
  if (!usuario || !(await verifyPassword(password, usuario.passwordHash))) {
    return noAutorizado("Las credenciales introducidas no son correctas.");
  }

  if (!usuario.activo) {
    return noAutorizado("Esta cuenta está desactivada. Contacta con el administrador.");
  }

  limpiarIntentos(clave);

  await crearSesion({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol === "ADMIN" ? "ADMIN" : "USUARIO",
  });

  return ok(
    {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
    "Sesión iniciada correctamente.",
  );
}
