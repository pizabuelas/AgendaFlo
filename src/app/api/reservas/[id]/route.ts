import type { NextRequest } from "next/server";

import { crearNotificacion } from "@/lib/services/notificaciones";
import {
  cancelarReserva,
  cambiarEstadoReserva,
  eliminarReserva,
  obtenerReserva,
} from "@/lib/services/reservas";
import { esquemaCambioEstado } from "@/lib/validators";
import { obtenerUsuarioActual } from "@/lib/session";
import { errorValidacion, noAutorizado, noEncontrado, ok } from "@/lib/api-response";

/** GET /api/reservas/[id] — Detalle de una reserva. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();

  const { id } = await params;
  const reserva = await obtenerReserva(id);

  if (!reserva) return noEncontrado("La reserva no existe.");
  if (usuario.rol !== "ADMIN" && reserva.usuarioId !== usuario.id) {
    return Response.json(
      { ok: false, mensaje: "No puedes consultar reservas de otros usuarios." },
      { status: 403 },
    );
  }

  return ok(reserva);
}

/**
 * PATCH /api/reservas/[id] — Cambia el estado de la reserva.
 * El propietario puede solicitar la cancelación; el administrador puede
 * confirmar, completar o cancelar cualquier cita.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();

  const { id } = await params;
  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaCambioEstado.safeParse(cuerpo);
  if (!validacion.success) {
    return errorValidacion(
      "Estado de reserva no válido.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const { estado, motivoCancelacion } = validacion.data;

  /* El usuario estándar solo puede cancelar sus propias citas. */
  if (usuario.rol !== "ADMIN" && estado !== "CANCELADA") {
    return Response.json(
      { ok: false, mensaje: "Solo puedes cancelar tus propias reservas." },
      { status: 403 },
    );
  }

  const resultado =
    estado === "CANCELADA"
      ? await cancelarReserva(id, usuario, motivoCancelacion)
      : await cambiarEstadoReserva(id, estado, motivoCancelacion);

  if (!resultado.ok) {
    return Response.json(
      { ok: false, mensaje: resultado.mensaje },
      { status: resultado.codigo ?? 422 },
    );
  }

  /* Avisamos al usuario afectado. */
  const reserva = await obtenerReserva(id);
  if (reserva) {
    await crearNotificacion({
      usuarioId: reserva.usuarioId,
      titulo: `Cita ${estado === "CANCELADA" ? "cancelada" : estado.toLowerCase()}`,
      mensaje: `Tu cita de ${reserva.servicio.nombre} (${reserva.codigo}) ha cambiado de estado.`,
      tipo: estado === "CANCELADA" ? "ERROR" : "INFO",
    });
  }

  return ok(resultado.datos, resultado.mensaje);
}

/** DELETE /api/reservas/[id] — Elimina definitivamente una reserva (admin). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();

  if (usuario.rol !== "ADMIN") {
    return Response.json(
      { ok: false, mensaje: "Solo los administradores pueden eliminar reservas." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const resultado = await eliminarReserva(id);

  if (!resultado.ok) {
    return Response.json(
      { ok: false, mensaje: resultado.mensaje },
      { status: resultado.codigo ?? 404 },
    );
  }

  return ok(undefined, resultado.mensaje);
}
