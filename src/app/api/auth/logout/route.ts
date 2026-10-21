import { cerrarSesion } from "@/lib/session";
import { ok } from "@/lib/api-response";

/** RF-01 — Cierre de sesión: revoca el token y elimina la cookie. */
export async function POST() {
  await cerrarSesion();
  return ok(undefined, "Sesión cerrada correctamente.");
}
