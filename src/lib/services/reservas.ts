import type { Prisma, Reserva } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { filtroTexto } from "@/lib/services/filtros";
import {
  DIAS_MAXIMO_ANTICIPACION,
  DIAS_MINIMO_ANTICIPACION,
  ESTADO_LABEL,
  MARGEN_MINUTOS_ANTICIPACION,
  MAX_RESERVAS_ACTIVAS,
  type EstadoReserva,
} from "@/lib/constants";
import {
  diaSemanaISO,
  fechaDesdeISO,
  generarCodigoReserva,
  generarHoras,
  isoDesdeFecha,
  sumarDiasISO,
} from "@/lib/utils";
import type { DatosReserva } from "@/lib/validators";

/**
 * Lógica de negocio de la agenda de citas (RF-04).
 *
 * Reglas implementadas:
 *  · Solo se pueden reservar servicios activos.
 *  · La cita debe caer dentro de una franja de atención configurada.
 *  · Un mismo servicio no admite dos reservas en la misma fecha y hora.
 *  · El usuario no puede superar el máximo de citas activas simultáneas.
 *  · No se admiten citas en el pasado ni con más de 60 días de antelación.
 */

const ESTADOS_ACTIVOS: EstadoReserva[] = ["PENDIENTE", "CONFIRMADA"];

/**
 * Ciclo de vida de una cita (RF-04).
 *
 * El recorrido es lineal y los dos últimos estados son terminales: una cita
 * completada o cancelada no vuelve atrás. La misma tabla es la que aplica el
 * panel de administración, de modo que la API no permite saltarse las reglas
 * que la interfaz sí respeta.
 */
export const TRANSICIONES_RESERVA: Record<EstadoReserva, EstadoReserva[]> = {
  PENDIENTE: ["CONFIRMADA", "CANCELADA"],
  CONFIRMADA: ["COMPLETADA", "CANCELADA"],
  COMPLETADA: [],
  CANCELADA: [],
};

/** Resultado de una operación: correcto o error con mensaje para el usuario. */
export type ResultadoOperacion<T = undefined> =
  | { ok: true; datos: T; mensaje: string }
  | { ok: false; mensaje: string; codigo?: number };

/* -------------------------------------------------------------------------- */
/* Disponibilidad                                                              */
/* -------------------------------------------------------------------------- */

/** Horario disponible (HH:mm) de un servicio en una fecha concreta. */
export interface HuecoDisponible {
  hora: string;
  disponible: boolean;
  motivo?: "ocupado" | "pasado";
}

/**
 * Calcula los huecos de un servicio para una fecha dada, marcando los que ya
 * están reservados o los que han pasado.
 */
export async function obtenerDisponibilidad(
  servicioId: string,
  fechaIso: string,
): Promise<HuecoDisponible[]> {
  const servicio = await prisma.servicio.findUnique({
    where: { id: servicioId },
    include: { horarios: { where: { activo: true } } },
  });

  if (!servicio || !servicio.activo) return [];

  const diaSemana = diaSemanaISO(fechaIso);
  const franjas = servicio.horarios.filter((h) => h.diaSemana === diaSemana);

  if (franjas.length === 0) return [];

  const reservas = await prisma.reserva.findMany({
    where: {
      servicioId,
      fecha: fechaDesdeISO(fechaIso),
      estado: { in: ESTADOS_ACTIVOS },
    },
    select: { hora: true },
  });

  const ocupadas = new Set(reservas.map((r) => r.hora));
  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const esHoy = fechaIso === isoDesdeFecha(inicioHoy);
  const limite = ahora.getTime() + MARGEN_MINUTOS_ANTICIPACION * 60 * 1000;

  const huecos: HuecoDisponible[] = [];

  for (const franja of franjas) {
    for (const hora of generarHoras(franja.horaInicio, franja.horaFin, servicio.duracionMin)) {
      if (ocupadas.has(hora)) {
        huecos.push({ hora, disponible: false, motivo: "ocupado" });
        continue;
      }

      if (esHoy) {
        const [h, m] = hora.split(":").map(Number);
        const instante = new Date(inicioHoy);
        instante.setHours(h, m, 0, 0);
        if (instante.getTime() < limite) {
          huecos.push({ hora, disponible: false, motivo: "pasado" });
          continue;
        }
      }

      huecos.push({ hora, disponible: true });
    }
  }

  return huecos.sort((a, b) => a.hora.localeCompare(b.hora));
}

/* -------------------------------------------------------------------------- */
/* Creación de reservas                                                        */
/* -------------------------------------------------------------------------- */

/** Comprueba que la fecha esté dentro de la ventana de reserva permitida. */
export function fechaEsReservable(fechaIso: string): boolean {
  const hoy = isoDesdeFecha(new Date());
  const limiteInferior = sumarDiasISO(hoy, DIAS_MINIMO_ANTICIPACION);
  const limiteSuperior = sumarDiasISO(hoy, DIAS_MAXIMO_ANTICIPACION);
  return fechaIso >= limiteInferior && fechaIso <= limiteSuperior;
}

/** Crea una reserva validando todas las reglas de negocio. */
export async function crearReserva(
  usuarioId: string,
  datos: DatosReserva,
): Promise<ResultadoOperacion<{ id: string; codigo: string }>> {
  const servicio = await prisma.servicio.findUnique({
    where: { id: datos.servicioId },
    include: { horarios: { where: { activo: true } } },
  });

  if (!servicio) {
    return { ok: false, mensaje: "El servicio seleccionado no existe.", codigo: 404 };
  }

  if (!servicio.activo) {
    return {
      ok: false,
      mensaje: "Este servicio no está disponible para reservas en este momento.",
      codigo: 422,
    };
  }

  if (!fechaEsReservable(datos.fecha)) {
    return {
      ok: false,
      mensaje: `Solo se puede reservar con ${DIAS_MINIMO_ANTICIPACION} a ${DIAS_MAXIMO_ANTICIPACION} días de antelación.`,
      codigo: 422,
    };
  }

  /* ¿La hora está dentro de una franja de atención del servicio? */
  const diaSemana = diaSemanaISO(datos.fecha);
  const dentroDeFranja = servicio.horarios.some(
    (franja) =>
      franja.diaSemana === diaSemana &&
      datos.hora >= franja.horaInicio &&
      datos.hora < franja.horaFin,
  );

  if (!dentroDeFranja) {
    return {
      ok: false,
      mensaje: "La hora seleccionada no está dentro del horario de atención del servicio.",
      codigo: 422,
    };
  }

  /* ¿El hueco sigue libre? */
  const ocupada = await prisma.reserva.findFirst({
    where: {
      servicioId: servicio.id,
      fecha: fechaDesdeISO(datos.fecha),
      hora: datos.hora,
      estado: { in: ESTADOS_ACTIVOS },
    },
    select: { id: true },
  });

  if (ocupada) {
    return {
      ok: false,
      mensaje: "Ese horario acaba de ser reservado. Elige otro hueco disponible.",
      codigo: 409,
    };
  }

  /* ¿El usuario supera el máximo de citas activas? */
  const activas = await prisma.reserva.count({
    where: { usuarioId, estado: { in: ESTADOS_ACTIVOS } },
  });

  if (activas >= MAX_RESERVAS_ACTIVAS) {
    return {
      ok: false,
      mensaje: `Tienes el máximo de ${MAX_RESERVAS_ACTIVAS} citas activas. Cancela alguna para reservar una nueva.`,
      codigo: 422,
    };
  }

  /* Creación. El índice único (servicioId, fecha, hora) actúa como segunda
   * barrera frente a reservas simultáneas del mismo hueco. */
  try {
    const reserva = await prisma.reserva.create({
      data: {
        codigo: generarCodigoReserva(),
        usuarioId,
        servicioId: servicio.id,
        fecha: fechaDesdeISO(datos.fecha),
        hora: datos.hora,
        duracionMin: servicio.duracionMin,
        precio: servicio.precio,
        estado: "PENDIENTE",
        notas: datos.notas || null,
      },
    });

    return {
      ok: true,
      datos: { id: reserva.id, codigo: reserva.codigo },
      mensaje: `¡Cita reservada! Tu código es ${reserva.codigo}.`,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return {
        ok: false,
        mensaje: "Ese horario acaba de ser reservado. Elige otro hueco disponible.",
        codigo: 409,
      };
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Consulta y gestión                                                          */
/* -------------------------------------------------------------------------- */

export interface FiltrosReservas {
  usuarioId?: string;
  estado?: EstadoReserva | "todos";
  q?: string;
  servicioId?: string;
  pagina?: number;
  porPagina?: number;
}

/** Lista reservas con filtros y paginación (panel de administración). */
export async function listarReservas(filtros: FiltrosReservas) {
  const pagina = filtros.pagina ?? 1;
  const porPagina = filtros.porPagina ?? 10;

  const where: Prisma.ReservaWhereInput = {};

  if (filtros.usuarioId) where.usuarioId = filtros.usuarioId;
  if (filtros.estado && filtros.estado !== "todos") where.estado = filtros.estado;
  if (filtros.servicioId) where.servicioId = filtros.servicioId;

  if (filtros.q) {
    where.OR = [
      { codigo: filtroTexto(filtros.q) },
      { usuario: { nombre: filtroTexto(filtros.q) } },
      { usuario: { email: filtroTexto(filtros.q) } },
      { servicio: { nombre: filtroTexto(filtros.q) } },
    ];
  }

  const [reservas, total] = await prisma.$transaction([
    prisma.reserva.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: { servicio: { select: { nombre: true, color: true, icono: true } }, usuario: { select: { nombre: true, email: true } } },
    }),
    prisma.reserva.count({ where }),
  ]);

  return {
    reservas,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

/** Detalle de una reserva. */
export async function obtenerReserva(id: string) {
  return prisma.reserva.findUnique({
    where: { id },
    include: {
      servicio: { include: { categoria: true } },
      usuario: { select: { id: true, nombre: true, email: true, telefono: true } },
    },
  });
}

/** Cambia el estado de una reserva (confirmar, completar o cancelar). */
export async function cambiarEstadoReserva(
  id: string,
  estado: EstadoReserva,
  motivo?: string,
): Promise<ResultadoOperacion<Reserva>> {
  const reserva = await prisma.reserva.findUnique({ where: { id } });

  if (!reserva) {
    return { ok: false, mensaje: "La reserva no existe.", codigo: 404 };
  }

  /* La cita solo puede avanzar en su ciclo de vida (RF-04). */
  const estadoActual = reserva.estado as EstadoReserva;
  const permitidas = [estadoActual, ...TRANSICIONES_RESERVA[estadoActual]];

  if (!permitidas.includes(estado)) {
    return {
      ok: false,
      mensaje:
        estadoActual === "CANCELADA"
          ? "Una cita cancelada no puede volver a activarse. Crea una nueva reserva."
          : `Una cita ${ESTADO_LABEL[estadoActual].toLowerCase()} no puede pasar a ${ESTADO_LABEL[estado].toLowerCase()}.`,
      codigo: 422,
    };
  }

  const reservaActualizada = await prisma.reserva.update({
    where: { id },
    data: {
      estado,
      ...(estado === "CANCELADA" ? { motivoCancelacion: motivo || null } : {}),
    },
  });

  return {
    ok: true,
    datos: reservaActualizada,
    mensaje:
      estado === "CONFIRMADA"
        ? "Cita confirmada."
        : estado === "COMPLETADA"
          ? "Cita marcada como completada."
          : estado === "CANCELADA"
            ? "Cita cancelada."
            : "Cita actualizada.",
  };
}

/** Cancela una reserva comprobando que el usuario sea el propietario o un admin. */
export async function cancelarReserva(
  id: string,
  actor: { id: string; rol: string },
  motivo?: string,
): Promise<ResultadoOperacion<Reserva>> {
  const reserva = await prisma.reserva.findUnique({ where: { id } });

  if (!reserva) return { ok: false, mensaje: "La reserva no existe.", codigo: 404 };

  if (actor.rol !== "ADMIN" && reserva.usuarioId !== actor.id) {
    return { ok: false, mensaje: "Solo puedes cancelar tus propias reservas.", codigo: 403 };
  }

  if (reserva.estado === "COMPLETADA") {
    return {
      ok: false,
      mensaje: "Una cita completada no se puede cancelar.",
      codigo: 422,
    };
  }

  return cambiarEstadoReserva(id, "CANCELADA", motivo);
}

/** Elimina definitivamente una reserva (uso exclusivo del administrador). */
export async function eliminarReserva(id: string): Promise<ResultadoOperacion<undefined>> {
  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) return { ok: false, mensaje: "La reserva no existe.", codigo: 404 };

  await prisma.reserva.delete({ where: { id } });
  return { ok: true, datos: undefined, mensaje: "Reserva eliminada." };
}

/* -------------------------------------------------------------------------- */
/* Métricas                                                                    */
/* -------------------------------------------------------------------------- */

/** Indicadores del panel de administración. */
export async function obtenerMetricas() {
  const hoy = isoDesdeFecha(new Date());

  const [
    totalReservas,
    pendientes,
    confirmadas,
    completadas,
    canceladas,
    reservasHoy,
    totalServicios,
    serviciosActivos,
    totalUsuarios,
    proximas,
  ] = await prisma.$transaction([
    prisma.reserva.count(),
    prisma.reserva.count({ where: { estado: "PENDIENTE" } }),
    prisma.reserva.count({ where: { estado: "CONFIRMADA" } }),
    prisma.reserva.count({ where: { estado: "COMPLETADA" } }),
    prisma.reserva.count({ where: { estado: "CANCELADA" } }),
    prisma.reserva.count({ where: { fecha: fechaDesdeISO(hoy) } }),
    prisma.servicio.count(),
    prisma.servicio.count({ where: { activo: true } }),
    prisma.usuario.count({ where: { activo: true } }),
    prisma.reserva.findMany({
      where: { estado: { in: ESTADOS_ACTIVOS }, fecha: { gte: fechaDesdeISO(hoy) } },
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
      take: 6,
      include: {
        servicio: { select: { nombre: true, color: true } },
        usuario: { select: { nombre: true } },
      },
    }),
  ]);

  const ingresos = await prisma.reserva.aggregate({
    where: { estado: { in: ["CONFIRMADA", "COMPLETADA"] } },
    _sum: { precio: true },
  });

  /* Reservas por día en los últimos 7 días, para el gráfico del panel. */
  const desde = fechaDesdeISO(sumarDiasISO(hoy, -6));
  const reservasSemana = await prisma.reserva.findMany({
    where: { fecha: { gte: desde } },
    select: { fecha: true, estado: true },
  });

  const serie = Array.from({ length: 7 }, (_, indice) => {
    const iso = sumarDiasISO(hoy, indice - 6);
    const delDia = reservasSemana.filter(
      (r) => isoDesdeFecha(r.fecha) === iso && r.estado !== "CANCELADA",
    );
    return {
      fecha: iso,
      dia: new Intl.DateTimeFormat("es-ES", {
        timeZone: "UTC",
        weekday: "short",
      }).format(fechaDesdeISO(iso)),
      total: delDia.length,
    };
  });

  return {
    totalReservas,
    pendientes,
    confirmadas,
    completadas,
    canceladas,
    reservasHoy,
    totalServicios,
    serviciosActivos,
    totalUsuarios,
    ingresos: ingresos._sum.precio ?? 0,
    proximas,
    serie,
  };
}
