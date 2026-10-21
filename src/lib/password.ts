import bcrypt from "bcryptjs";

/**
 * Coste de bcrypt. 12 rondas es el valor recomendado actualmente
 * (≈250 ms por hash): suficientemente lento para frenar ataques de
 * fuerza bruta y lo bastante rápido para una experiencia de uso fluida.
 */
const SALT_ROUNDS = 12;

/** Longitud máxima admitida por bcrypt (72 bytes). */
export const LONGITUD_MAXIMA_PASSWORD = 72;

/** Hashea una contraseña en texto plano. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con su hash.
 * Devuelve `false` si el hash no es válido en lugar de lanzar una excepción.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Complejidad mínima exigida al usuario (RNF-03). */
export const REGLAS_PASSWORD = [
  { id: "longitud", mensaje: "Debe tener al menos 8 caracteres", ok: (v: string) => v.length >= 8 },
  { id: "mayuscula", mensaje: "Debe incluir al menos una mayúscula", ok: (v: string) => /[A-Z]/.test(v) },
  { id: "minuscula", mensaje: "Debe incluir al menos una minúscula", ok: (v: string) => /[a-z]/.test(v) },
  { id: "numero", mensaje: "Debe incluir al menos un número", ok: (v: string) => /\d/.test(v) },
] as const;

/** Devuelve los identificadores de las reglas de contraseña que no se cumplen. */
export function reglasPasswordFallidas(password: string): string[] {
  return REGLAS_PASSWORD.filter((regla) => !regla.ok(password)).map((r) => r.id);
}
