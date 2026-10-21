import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { filtroTexto } from "@/lib/services/filtros";
import type { DatosActualizarUsuario } from "@/lib/validators";
import type { Rol } from "@/lib/constants";

/**
 * Gestión de usuarios del panel de administración (RF-01).
 */
export interface FiltrosUsuarios {
  q?: string;
  rol?: Rol | "todos";
  pagina?: number;
  porPagina?: number;
}

/** Lista usuarios con búsqueda y filtro por rol. */
export async function listarUsuarios(filtros: FiltrosUsuarios = {}) {
  const pagina = filtros.pagina ?? 1;
  const porPagina = filtros.porPagina ?? 10;

  const where: Prisma.UsuarioWhereInput = {};

  if (filtros.rol && filtros.rol !== "todos") where.rol = filtros.rol;

  if (filtros.q) {
    where.OR = [
      { nombre: filtroTexto(filtros.q) },
      { email: filtroTexto(filtros.q) },
    ];
  }

  const [usuarios, total] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        telefono: true,
        activo: true,
        createdAt: true,
        _count: { select: { reservas: true } },
      },
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    usuarios,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

/** Detalle de un usuario con el resumen de sus reservas. */
export async function obtenerUsuario(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      telefono: true,
      activo: true,
      createdAt: true,
      _count: { select: { reservas: true, sesiones: true } },
    },
  });
}

/**
 * Actualiza el rol o el estado de un usuario.
 * Protege al administrador de que se quite a sí mismo los permisos.
 */
export async function actualizarUsuario(
  id: string,
  datos: DatosActualizarUsuario,
  actorId: string,
) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });

  if (!usuario) {
    return { ok: false as const, mensaje: "El usuario no existe.", codigo: 404 };
  }

  if (usuario.id === actorId && datos.rol && datos.rol !== "ADMIN") {
    return {
      ok: false as const,
      mensaje: "No puedes quitarte a ti mismo el rol de administrador.",
      codigo: 422,
    };
  }

  if (usuario.id === actorId && datos.activo === false) {
    return {
      ok: false as const,
      mensaje: "No puedes desactivar tu propia cuenta.",
      codigo: 422,
    };
  }

  /* Si el usuario deja de ser administrador, sus sesiones abiertas pierden
   * los privilegios de forma inmediata. */
  if (datos.rol && datos.rol !== "ADMIN" && usuario.rol === "ADMIN") {
    await prisma.sesion.updateMany({
      where: { usuarioId: id, revocada: false },
      data: { revocada: true },
    });
  }

  if (datos.activo === false) {
    await prisma.sesion.updateMany({
      where: { usuarioId: id, revocada: false },
      data: { revocada: true },
    });
  }

  const actualizado = await prisma.usuario.update({
    where: { id },
    data: {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.rol !== undefined ? { rol: datos.rol } : {}),
      ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
      ...(datos.telefono !== undefined ? { telefono: datos.telefono || null } : {}),
    },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });

  return { ok: true as const, datos: actualizado, mensaje: "Usuario actualizado." };
}
