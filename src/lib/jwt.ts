import { SignJWT, jwtVerify } from "jose";

import { DURACION_SESION_SEGUNDOS, type Rol } from "./constants";

/**
 * Capa de firmado de tokens (compatible con el runtime Edge).
 * No importa Prisma ni `next/headers`, de modo que puede usarse desde
 * `middleware.ts` sin romper el bundle.
 */

export const NOMBRE_COOKIE_SESION = "agendaflow_sesion";

/* Clave de desarrollo: solo se usa si falta AUTH_SECRET, para que la app
 * arranque y muestre un aviso en lugar de fallar con un error 500. */
const SECRETO_DE_DESARROLLO =
  "agendaflow-clave-de-desarrollo-no-usar-en-produccion-cambiar";

export function obtenerSecreto(): Uint8Array {
  const valor = process.env.AUTH_SECRET?.trim();

  if (!valor || valor.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET no está definido o es demasiado corto. " +
          "Debe tener al menos 32 caracteres (ver .env.example).",
      );
    }
    console.warn(
      "[AgendaFlow] AUTH_SECRET no configurado: se usa una clave temporal de desarrollo.",
    );
    return new TextEncoder().encode(SECRETO_DE_DESARROLLO);
  }

  return new TextEncoder().encode(valor);
}

/** Contenido del token de sesión. */
export interface PayloadSesion {
  /** Identificador del usuario. */
  sub: string;
  email: string;
  nombre: string;
  rol: Rol;
  /** Identificador único de la sesión (para poder revocarla). */
  jti: string;
  iat?: number;
  exp?: number;
}

/** Genera un identificador único de sesión. */
export function generarJti(): string {
  return crypto.randomUUID();
}

/** Firma un token JWT de sesión. */
export async function firmarToken(payload: PayloadSesion): Promise<string> {
  return new SignJWT({
    email: payload.email,
    nombre: payload.nombre,
    rol: payload.rol,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEGUNDOS}s`)
    .sign(obtenerSecreto());
}

/**
 * Verifica la firma y la expiración del token.
 * Devuelve `null` si el token es inválido, está manipulado o ha expirado.
 */
export async function verificarToken(
  token: string | undefined | null,
): Promise<PayloadSesion | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, obtenerSecreto(), {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !payload.jti) return null;

    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      nombre: String(payload.nombre ?? ""),
      rol: payload.rol === "ADMIN" ? "ADMIN" : "USUARIO",
      jti: String(payload.jti),
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
