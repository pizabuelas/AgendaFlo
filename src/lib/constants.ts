/**
 * Constantes de dominio de AgendaFlow.
 * Los estados y roles se guardan como `String` en la base de datos para que el
 * mismo esquema funcione en PostgreSQL y en SQLite; aquí se tipan y se
 * traducen a la etiqueta y al color que usa la interfaz.
 */

/* -------------------------------------------------------------------------- */
/* Roles (RF-01)                                                              */
/* -------------------------------------------------------------------------- */

export const ROLES = ["USUARIO", "ADMIN"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABEL: Record<Rol, string> = {
  USUARIO: "Usuario estándar",
  ADMIN: "Administrador",
};

/* -------------------------------------------------------------------------- */
/* Estados de reserva (RF-04)                                                 */
/* -------------------------------------------------------------------------- */

export const ESTADOS_RESERVA = [
  "PENDIENTE",
  "CONFIRMADA",
  "COMPLETADA",
  "CANCELADA",
] as const;
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

export const ESTADO_LABEL: Record<EstadoReserva, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

/** Tono visual asociado a cada estado (coincide con los tonos de `Insignia`). */
export const ESTADO_TONE: Record<
  EstadoReserva,
  "info" | "exito" | "aviso" | "peligro"
> = {
  PENDIENTE: "aviso",
  CONFIRMADA: "info",
  COMPLETADA: "exito",
  CANCELADA: "peligro",
};

/** Tipos de notificación persistida (RF-05). */
export const TIPOS_NOTIFICACION = ["EXITO", "ERROR", "INFO"] as const;
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

/* -------------------------------------------------------------------------- */
/* Agenda                                                                      */
/* -------------------------------------------------------------------------- */

export const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const DIAS_SEMANA_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

/** Franja de atención por defecto usada en la semilla. */
export const HORARIO_ATENCION = {
  inicio: "09:00",
  fin: "18:00",
} as const;

/** Duraciones ofrecidas al usuario al crear un servicio (en minutos). */
export const DURACIONES = [
  15, 30, 45, 60, 90, 120, 180, 240, 300, 360,
] as const;

/** Colores de acento disponibles para tarjetas y categorías. */
export const COLORES = [
  "indigo",
  "violet",
  "sky",
  "emerald",
  "amber",
  "rose",
  "teal",
  "orange",
] as const;
export type ColorAcento = (typeof COLORES)[number];

/* -------------------------------------------------------------------------- */
/* Reglas de negocio                                                           */
/* -------------------------------------------------------------------------- */

/** Máximo de citas activas simultáneas por usuario. */
export const MAX_RESERVAS_ACTIVAS = 5;

/** Días hacia atrás que se permite reservar (0 = hoy). */
export const DIAS_MINIMO_ANTICIPACION = 0;

/** Días hacia adelante que se puede reservar. */
export const DIAS_MAXIMO_ANTICIPACION = 60;

/** Margen (en minutos) antes de la hora de inicio de la cita. */
export const MARGEN_MINUTOS_ANTICIPACION = 60;

/* -------------------------------------------------------------------------- */
/* Opciones de ordenamiento (RF-03)                                           */
/* -------------------------------------------------------------------------- */

export const ORDENES_SERVICIOS = [
  "relevancia",
  "precio-asc",
  "precio-desc",
  "duracion-asc",
  "duracion-desc",
  "nombre-asc",
  "nombre-desc",
  "recientes",
] as const;
export type OrdenServicios = (typeof ORDENES_SERVICIOS)[number];

export const ORDEN_LABEL: Record<OrdenServicios, string> = {
  relevancia: "Relevancia",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  "duracion-asc": "Duración: menor a mayor",
  "duracion-desc": "Duración: mayor a mayor",
  "nombre-asc": "Nombre (A–Z)",
  "nombre-desc": "Nombre (Z–A)",
  recientes: "Más recientes",
};

/** Duraciones de la cookie de sesión (7 días). */
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 24 * 7;
