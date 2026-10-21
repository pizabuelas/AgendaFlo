import { obtenerUsuarioActual } from "@/lib/session";
import { noAutorizado, ok } from "@/lib/api-response";

/** Devuelve los datos del usuario de la sesión actual, si la hay. */
export async function GET() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) return noAutorizado("No hay ninguna sesión activa.");

  return ok(usuario);
}
