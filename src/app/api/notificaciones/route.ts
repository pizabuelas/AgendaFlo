import type { NextRequest } from "next/server";

import {
  listarNotificaciones,
  marcarTodasLeidas,
} from "@/lib/services/notificaciones";
import { obtenerUsuarioActual } from "@/lib/session";
import { noAutorizado, ok } from "@/lib/api-response";

/** GET /api/notificaciones — Notificaciones del usuario actual. */
export async function GET(request: NextRequest) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();

  const url = new URL(request.url);
  const limite = Number(url.searchParams.get("limite") ?? 20);

  const notificaciones = await listarNotificaciones(
    usuario.id,
    Number.isFinite(limite) ? Math.min(limite, 50) : 20,
  );

  return ok(notificaciones);
}

/** PATCH /api/notificaciones — Marca todas las notificaciones como leídas. */
export async function PATCH() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();

  await marcarTodasLeidas(usuario.id);
  return ok(undefined, "Notificaciones marcadas como leídas.");
}
