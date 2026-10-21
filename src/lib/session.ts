import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "./prisma";
import {
  NOMBRE_COOKIE_SESION,
  firmarToken,
  generarJti,
  verificarToken,
} from "./jwt";
import { DURACION_SESION_SEGUNDOS, type Rol } from "./constants";

/**
 * Gestión de sesiones en el servidor (Node).
 * El JWT viaja en una cookie `httpOnly` + `SameSite=Lax`, y cada sesión
 * queda registrada en la base de datos para poder revocarla al cerrar sesión.
 */

/** Opciones de la cookie de sesión. */
function opcionesCookie(expira: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expira,
  };
}

/**
 * Crea una sesión para el usuario indicado: firma el token, lo guarda en
 * cookie y registra la sesión en la base de datos.
 */
export async function crearSesion(usuario: {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}): Promise<{ token: string; expira: Date }> {
  const jti = generarJti();
  const expira = new Date(Date.now() + DURACION_SESION_SEGUNDOS * 1000);

  const token = await firmarToken({
    sub: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    jti,
  });

  const cabeceras = await headers();

  await prisma.sesion.create({
    data: {
      jti,
      usuarioId: usuario.id,
      expiresAt: expira,
      userAgent: cabeceras.get("user-agent")?.slice(0, 255) ?? null,
      ip:
        cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 45) ??
        cabeceras.get("x-real-ip")?.slice(0, 45) ??
        null,
    },
  });

  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE_SESION, token, opcionesCookie(expira));

  return { token, expira };
}

/** Cierra la sesión actual: revoca el registro y elimina la cookie. */
export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  const token = almacen.get(NOMBRE_COOKIE_SESION)?.value;
  const payload = await verificarToken(token);

  if (payload) {
    await prisma.sesion
      .update({ where: { jti: payload.jti }, data: { revocada: true } })
      .catch(() => undefined);
  }

  almacen.set(NOMBRE_COOKIE_SESION, "", { ...opcionesCookie(new Date(0)), maxAge: 0 });
}

/** Revoca todas las sesiones activas de un usuario. */
export async function revocarTodasLasSesiones(usuarioId: string): Promise<void> {
  await prisma.sesion.updateMany({
    where: { usuarioId, revocada: false },
    data: { revocada: true },
  });
}

/** Usuario con la sesión válida, o `null`. */
export interface UsuarioActual {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
}

/**
 * Resuelve el usuario de la petición actual.
 * `cache()` evita repetir la consulta cuando la misma función se invoca
 * varias veces durante un mismo renderizado.
 */
export const obtenerUsuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  const almacen = await cookies();
  const token = almacen.get(NOMBRE_COOKIE_SESION)?.value;
  const payload = await verificarToken(token);

  if (!payload) return null;

  const sesion = await prisma.sesion.findUnique({
    where: { jti: payload.jti },
    select: { id: true, revocada: true, expiresAt: true },
  });

  if (!sesion || sesion.revocada || sesion.expiresAt < new Date()) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      telefono: true,
      activo: true,
    },
  });

  if (!usuario || !usuario.activo) return null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol === "ADMIN" ? "ADMIN" : "USUARIO",
    telefono: usuario.telefono,
  };
});

/** Igual que `obtenerUsuarioActual` pero redirige si no hay sesión. */
export async function requiereUsuario(ruta = "/login"): Promise<UsuarioActual> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect(ruta);
  return usuario;
}

/** Igual que `obtenerUsuarioActual` pero redirige si no es administrador. */
export async function requiereAdmin(ruta = "/login"): Promise<UsuarioActual> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect(ruta);
  if (usuario.rol !== "ADMIN") redirect("/");
  return usuario;
}
