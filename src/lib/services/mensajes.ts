import { prisma } from "@/lib/prisma";
import type { DatosContacto } from "@/lib/validators";

/**
 * Mensajes enviados desde el formulario de contacto.
 * Se guardan en la base de datos para que el equipo los pueda revisar.
 */

/** Registra un mensaje de contacto. */
export async function crearMensajeContacto(datos: DatosContacto) {
  return prisma.mensajeContacto.create({
    data: {
      nombre: datos.nombre,
      email: datos.email,
      asunto: datos.asunto,
      mensaje: datos.mensaje,
    },
    select: { id: true, createdAt: true },
  });
}

/** Lista los mensajes de contacto, del más reciente al más antiguo. */
export async function listarMensajesContacto(porPagina = 20) {
  return prisma.mensajeContacto.findMany({
    orderBy: { createdAt: "desc" },
    take: porPagina,
    select: {
      id: true,
      nombre: true,
      email: true,
      asunto: true,
      mensaje: true,
      atendido: true,
      createdAt: true,
    },
  });
}
