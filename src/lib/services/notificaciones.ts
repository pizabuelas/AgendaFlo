import { prisma } from "@/lib/prisma";
import type { TipoNotificacion } from "@/lib/constants";

/**
 * Notificaciones persistidas (RF-05).
 * Además del aviso en pantalla (toast), cada acción relevante deja un
 * registro consultable por el usuario desde su panel.
 */

/** Crea una notificación para el usuario indicado. */
export async function crearNotificacion(params: {
  usuarioId: string;
  titulo: string;
  mensaje: string;
  tipo?: TipoNotificacion;
}) {
  return prisma.notificacion.create({
    data: {
      usuarioId: params.usuarioId,
      titulo: params.titulo,
      mensaje: params.mensaje,
      tipo: params.tipo ?? "INFO",
    },
  });
}

/** Notificaciones del usuario, más recientes primero. */
export async function listarNotificaciones(usuarioId: string, limite = 20) {
  return prisma.notificacion.findMany({
    where: { usuarioId },
    orderBy: { createdAt: "desc" },
    take: limite,
  });
}

/** Número de notificaciones sin leer. */
export async function contarNoLeidas(usuarioId: string) {
  return prisma.notificacion.count({ where: { usuarioId, leida: false } });
}

/** Marca una notificación como leída. */
export async function marcarLeida(id: string, usuarioId: string) {
  return prisma.notificacion.updateMany({
    where: { id, usuarioId },
    data: { leida: true },
  });
}

/** Marca todas las notificaciones del usuario como leídas. */
export async function marcarTodasLeidas(usuarioId: string) {
  return prisma.notificacion.updateMany({
    where: { usuarioId, leida: false },
    data: { leida: true },
  });
}
