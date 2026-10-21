import type { NextRequest } from "next/server";

import { crearNotificacion } from "@/lib/services/notificaciones";
import { crearReserva, listarReservas } from "@/lib/services/reservas";
import { esquemaReserva } from "@/lib/validators";
import { obtenerUsuarioActual } from "@/lib/session";
import { errorValidacion, noAutorizado, ok } from "@/lib/api-response";

/**
 * GET /api/reservas — Lista las reservas del usuario actual.
 * Los administradores pueden consultar las de todos los usuarios mediante
 * el parámetro `?usuarioId=`.
 */
export async function GET(request: NextRequest) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();

  const url = new URL(request.url);
  const solicitado = url.searchParams.get("usuarioId");
  const estado = url.searchParams.get("estado");
  const q = url.searchParams.get("q") ?? "";
  const pagina = Number(url.searchParams.get("pagina") ?? 1);
  const porPagina = Number(url.searchParams.get("porPagina") ?? 10);

  const usuarioId =
    usuario.rol === "ADMIN" && solicitado ? solicitado : usuario.id;

  const resultado = await listarReservas({
    usuarioId,
    estado:
      estado && ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA", "todos"].includes(estado)
        ? (estado as "todos")
        : "todos",
    q,
    pagina: Number.isFinite(pagina) ? pagina : 1,
    porPagina: Number.isFinite(porPagina) ? Math.min(porPagina, 48) : 10,
  });

  return ok(resultado);
}

/**
 * POST /api/reservas — Crea una cita (RF-04).
 * Todas las reglas de negocio (franja de atención, hueco libre, límite de
 * citas activas, ventana de antelación) se validan en el servicio.
 */
export async function POST(request: NextRequest) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado("Debes iniciar sesión para reservar una cita.");

  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaReserva.safeParse(cuerpo);
  if (!validacion.success) {
    return errorValidacion(
      "Revisa los datos de la reserva.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const resultado = await crearReserva(usuario.id, validacion.data);

  if (!resultado.ok) {
    return Response.json(
      { ok: false, mensaje: resultado.mensaje },
      { status: resultado.codigo ?? 422 },
    );
  }

  await crearNotificacion({
    usuarioId: usuario.id,
    titulo: "Cita reservada",
    mensaje: `${resultado.mensaje} Revisa tu panel de citas para más detalles.`,
    tipo: "EXITO",
  });

  return ok(resultado.datos, resultado.mensaje);
}
