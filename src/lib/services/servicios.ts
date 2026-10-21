import type { Categoria, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { filtroTexto } from "@/lib/services/filtros";
import { slugify } from "@/lib/utils";
import type { DatosServicio, ParametrosServicios } from "@/lib/validators";

/**
 * Capa de lógica de negocio para los servicios (RF-02 y RF-03).
 * Las rutas de la API se limitan a validar y serializar; el acceso a datos
 * vive aquí, de modo que las reglas se reutilizan desde la interfaz y desde
 * los endpoints sin duplicar código.
 */

/** Rangos de precio sugerido en el buscador. */
export const RANGOS_PRECIO = [
  { id: "0-50", etiqueta: "Hasta 50", min: 0, max: 50 },
  { id: "50-100", etiqueta: "50 – 100", min: 50, max: 100 },
  { id: "100-200", etiqueta: "100 – 200", min: 100, max: 200 },
  { id: "200-0", etiqueta: "Más de 200", min: 200, max: undefined },
] as const;

/** Filtros de duración ofrecidos en la interfaz. */
export const RANGOS_DURACION = [
  { id: "45", etiqueta: "Hasta 45 min", max: 45 },
  { id: "60", etiqueta: "60 min", max: 60 },
  { id: "120", etiqueta: "Hasta 2 h", max: 120 },
  { id: "240", etiqueta: "Media jornada", max: 240 },
] as const;

/** Servicio con la categoría a la que pertenece (relación incluida). */
export type ServicioConCategoria = Prisma.ServicioGetPayload<{
  include: { categoria: true };
}>;

export interface ResultadoServicios {
  servicios: ServicioConCategoria[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/**
 * Lista servicios aplicando búsqueda, filtros combinables, orden y paginación.
 */
export async function listarServicios(
  params: ParametrosServicios,
  opciones: { incluirInactivos?: boolean } = {},
): Promise<ResultadoServicios> {
  const where: Prisma.ServicioWhereInput = {};

  if (!opciones.incluirInactivos && params.estado !== "todos") {
    where.activo = true;
  } else if (params.estado === "activo") {
    where.activo = true;
  } else if (params.estado === "inactivo") {
    where.activo = false;
  }

  if (params.q) {
    where.OR = [
      { nombre: filtroTexto(params.q) },
      { descripcion: filtroTexto(params.q) },
      { categoria: { nombre: filtroTexto(params.q) } },
    ];
  }

  if (params.categoria) {
    where.categoria = { slug: params.categoria };
  }

  if (params.precioMin !== undefined || params.precioMax !== undefined) {
    where.precio = {
      ...(params.precioMin !== undefined ? { gte: params.precioMin } : {}),
      ...(params.precioMax !== undefined ? { lte: params.precioMax } : {}),
    };
  }

  if (params.duracionMax !== undefined) {
    where.duracionMin = { lte: params.duracionMax };
  }

  const orden: Prisma.ServicioOrderByWithRelationInput[] =
    (() => {
      switch (params.orden) {
        case "precio-asc":
          return [{ precio: "asc" }];
        case "precio-desc":
          return [{ precio: "desc" }];
        case "duracion-asc":
          return [{ duracionMin: "asc" }];
        case "duracion-desc":
          return [{ duracionMin: "desc" }];
        case "nombre-asc":
          return [{ nombre: "asc" }];
        case "nombre-desc":
          return [{ nombre: "desc" }];
        case "recientes":
          return [{ createdAt: "desc" }];
        default:
          // "relevancia": los destacados primero, después orden alfabético.
          return [{ destacado: "desc" }, { nombre: "asc" }];
      }
    })();

  const skip = (params.pagina - 1) * params.porPagina;

  const [servicios, total] = await prisma.$transaction([
    prisma.servicio.findMany({
      where,
      orderBy: orden,
      skip,
      take: params.porPagina,
      include: { categoria: true },
    }),
    prisma.servicio.count({ where }),
  ]);

  return {
    servicios,
    total,
    pagina: params.pagina,
    porPagina: params.porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / params.porPagina)),
  };
}

/** Categoría con el número de servicios activos que contiene. */
export type CategoriaConConteo = Prisma.CategoriaGetPayload<{
  include: { _count: { select: { servicios: true } } };
}>;

/**
 * Lista las categorías activas con el número de servicios de cada una.
 * La sobrecarga con `conContaje: true` incluye el contador en el tipo.
 */
export async function listarCategorias(conContaje: true): Promise<CategoriaConConteo[]>;
export async function listarCategorias(conContaje?: false): Promise<Categoria[]>;
export async function listarCategorias(conContaje = false) {
  return prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { nombre: "asc" },
    include: conContaje
      ? {
          _count: {
            select: { servicios: { where: { activo: true } } },
          },
        }
      : undefined,
  });
}

/**
 * Lista todos los servicios con sus horarios de atención.
 * La usa el panel de administración (RF-02), que necesita editar la
 * configuración completa de cada servicio, incluidos los dados de baja.
 */
export async function listarServiciosAdmin() {
  return prisma.servicio.findMany({
    orderBy: { nombre: "asc" },
    include: {
      categoria: { select: { id: true, nombre: true } },
      horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
    },
  });
}

/**
 * Lista todas las categorías (activas e inactivas).
 * La usa el panel de administración, que necesita también las categorías
 * dadas de baja para poder reasignar o editar servicios.
 */
export async function listarTodasCategorias() {
  return prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, slug: true, activa: true },
  });
}

/** Obtiene un servicio por su slug, con categoría y horarios. */
export async function obtenerServicioPorSlug(slug: string) {
  return prisma.servicio.findUnique({
    where: { slug },
    include: { categoria: true, horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] } },
  });
}

/** Obtiene un servicio por su identificador. */
export async function obtenerServicioPorId(id: string) {
  return prisma.servicio.findUnique({
    where: { id },
    include: { categoria: true, horarios: true },
  });
}

/** Genera un slug único a partir del nombre (añade un sufijo si ya existe). */
export async function generarSlugUnico(nombre: string, idExcluido?: string) {
  const base = slugify(nombre) || "servicio";
  let candidato = base;
  let contador = 2;

  while (true) {
    const existente = await prisma.servicio.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!existente || existente.id === idExcluido) return candidato;
    candidato = `${base}-${contador}`;
    contador += 1;
  }
}

/** Crea un servicio con sus horarios de atención (RF-02). */
export async function crearServicio(datos: DatosServicio) {
  const slug = await generarSlugUnico(datos.nombre);

  return prisma.servicio.create({
    data: {
      nombre: datos.nombre,
      slug,
      descripcion: datos.descripcion,
      precio: datos.precio,
      duracionMin: datos.duracionMin,
      icono: datos.icono,
      color: datos.color,
      destacado: datos.destacado,
      activo: datos.activo,
      categoriaId: datos.categoriaId,
      horarios: {
        create: datos.horarios.map((h) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
        })),
      },
    },
    include: { categoria: true },
  });
}

/** Actualiza un servicio y reemplaza sus horarios. */
export async function actualizarServicio(id: string, datos: Partial<DatosServicio>) {
  const existente = await prisma.servicio.findUnique({ where: { id } });
  if (!existente) return null;

  const slug =
    datos.nombre && datos.nombre !== existente.nombre
      ? await generarSlugUnico(datos.nombre, id)
      : existente.slug;

  return prisma.$transaction(async (tx) => {
    if (datos.horarios) {
      await tx.horario.deleteMany({ where: { servicioId: id } });
    }

    return tx.servicio.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
        ...(datos.descripcion !== undefined ? { descripcion: datos.descripcion } : {}),
        ...(datos.precio !== undefined ? { precio: datos.precio } : {}),
        ...(datos.duracionMin !== undefined ? { duracionMin: datos.duracionMin } : {}),
        ...(datos.icono !== undefined ? { icono: datos.icono } : {}),
        ...(datos.color !== undefined ? { color: datos.color } : {}),
        ...(datos.destacado !== undefined ? { destacado: datos.destacado } : {}),
        ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
        ...(datos.categoriaId !== undefined ? { categoriaId: datos.categoriaId } : {}),
        ...(slug !== existente.slug ? { slug } : {}),
        ...(datos.horarios
          ? {
              horarios: {
                create: datos.horarios.map((h) => ({
                  diaSemana: h.diaSemana,
                  horaInicio: h.horaInicio,
                  horaFin: h.horaFin,
                })),
              },
            }
          : {}),
      },
      include: { categoria: true, horarios: true },
    });
  });
}

/** Da de baja un servicio (baja lógica: se conserva el historial de reservas). */
export async function darDeBajaServicio(id: string) {
  return prisma.servicio.update({ where: { id }, data: { activo: false } });
}

/** Reactiva un servicio previamente dado de baja. */
export async function reactivarServicio(id: string) {
  return prisma.servicio.update({ where: { id }, data: { activo: true } });
}

/** Elimina definitivamente un servicio (solo si no tiene reservas). */
export async function eliminarServicio(id: string) {
  const reservas = await prisma.reserva.count({ where: { servicioId: id } });
  if (reservas > 0) return { eliminado: false, motivo: "tiene reservas asociadas" };

  await prisma.servicio.delete({ where: { id } });
  return { eliminado: true as const };
}
