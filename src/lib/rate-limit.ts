/**
 * Limitador de peticiones en memoria.
 *
 * Protege los endpoints sensibles (registro e inicio de sesión) frente a
 * ataques de fuerza bruta. En un despliegue con varias instancias habría que
 * sustituirlo por Redis, pero para el alcance del proyecto es suficiente.
 */

interface Registro {
  intentos: number;
  reiniciaEn: number;
}

const registros = new Map<string, Registro>();

/** Ventana de bloqueo tras superar el máximo de intentos (15 minutos). */
export const VENTANA_MS = 15 * 60 * 1000;

/** Máximo de intentos permitidos por ventana. */
export const MAX_INTENTOS = 8;

/**
 * Registra un intento y devuelve `true` si la petición debe permitirse.
 */
export function permitirIntento(clave: string): boolean {
  const ahora = Date.now();
  const registro = registros.get(clave);

  if (!registro || ahora > registro.reiniciaEn) {
    registros.set(clave, { intentos: 1, reiniciaEn: ahora + VENTANA_MS });
    return true;
  }

  if (registro.intentos >= MAX_INTENTOS) return false;

  registro.intentos += 1;
  return true;
}

/** Elimina el registro de una clave (tras un inicio de sesión correcto). */
export function limpiarIntentos(clave: string): void {
  registros.delete(clave);
}

/** Segundos restantes para el próximo intento permitido. */
export function segundosRestantes(clave: string): number {
  const registro = registros.get(clave);
  if (!registro) return 0;
  return Math.max(0, Math.ceil((registro.reiniciaEn - Date.now()) / 1000));
}
