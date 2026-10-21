import { z } from "zod";

import { LONGITUD_MAXIMA_PASSWORD } from "@/lib/password";

/**
 * Esquemas de validación de entrada (RNF-03).
 * Toda entrada del usuario se valida y se sanea antes de tocar la base de
 * datos, lo que evita XSS reflected y errores por datos malformados.
 */

const email = z
  .string({ required_error: "El correo electrónico es obligatorio." })
  .trim()
  .toLowerCase()
  .min(5, "El correo electrónico es demasiado corto.")
  .max(254, "El correo electrónico es demasiado largo.")
  .email("Introduce un correo electrónico válido.");

const password = z
  .string({ required_error: "La contraseña es obligatoria." })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(LONGITUD_MAXIMA_PASSWORD, `La contraseña no puede superar ${LONGITUD_MAXIMA_PASSWORD} caracteres.`)
  .regex(/[a-z]/, "La contraseña debe incluir al menos una letra minúscula.")
  .regex(/[A-Z]/, "La contraseña debe incluir al menos una letra mayúscula.")
  .regex(/\d/, "La contraseña debe incluir al menos un número.");

const telefono = z
  .string()
  .trim()
  .max(20, "El teléfono no puede superar 20 caracteres.")
  .regex(/^[0-9+()\s.-]*$/, "El teléfono solo admite números y los signos + ( ) . -")
  .optional()
  .or(z.literal(""));

/* -------------------------------------------------------------------------- */
/* RF-01 · Autenticación y gestión de usuarios                                */
/* -------------------------------------------------------------------------- */

export const esquemaRegistro = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio." })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  email,
  password,
  confirmPassword: z.string({ required_error: "Confirma tu contraseña." }),
  telefono,
  aceptarTerminos: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos y condiciones." }),
  }),
});

export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export const esquemaLogin = z.object({
  email,
  password: z.string({ required_error: "La contraseña es obligatoria." }).min(1, "Escribe tu contraseña."),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;

/* -------------------------------------------------------------------------- */
/* RF-02 · Gestión de servicios (CRUD)                                        */
/* -------------------------------------------------------------------------- */

const HORARIO_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const esquemaServicio = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio." })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  descripcion: z
    .string({ required_error: "La descripción es obligatoria." })
    .trim()
    .min(20, "La descripción debe tener al menos 20 caracteres.")
    .max(1200, "La descripción no puede superar 1200 caracteres."),
  categoriaId: z.string({ required_error: "Selecciona una categoría." }).min(1, "Selecciona una categoría."),
  precio: z.coerce
    .number({ required_error: "Indica el precio." })
    .positive("El precio debe ser mayor que cero.")
    .max(100000, "El precio parece incorrecto."),
  duracionMin: z.coerce
    .number({ required_error: "Indica la duración." })
    .int("La duración debe ser un número entero.")
    .min(15, "La duración mínima es de 15 minutos.")
    .max(480, "La duración máxima es de 8 horas.")
    .refine((v) => v % 15 === 0, "La duración debe ser múltiplo de 15 minutos."),
  icono: z.string().trim().max(40).optional().default("calendar"),
  color: z
    .enum(["indigo", "violet", "sky", "emerald", "amber", "rose", "teal", "orange"])
    .optional()
    .default("indigo"),
  destacado: z.boolean().optional().default(false),
  activo: z.boolean().optional().default(true),
  horarios: z
    .array(
      z.object({
        diaSemana: z.coerce.number().int().min(0).max(6),
        horaInicio: z.string().regex(HORARIO_REGEX, "Hora de inicio inválida (HH:mm)."),
        horaFin: z.string().regex(HORARIO_REGEX, "Hora de fin inválida (HH:mm)."),
      }),
    )
    .max(21, "No se pueden definir más de 21 franjas por servicio.")
    .optional()
    .default([]),
});

export type DatosServicio = z.infer<typeof esquemaServicio>;

export const esquemaActualizarServicio = esquemaServicio.partial();

/* -------------------------------------------------------------------------- */
/* RF-04 · Reservas                                                            */
/* -------------------------------------------------------------------------- */

export const esquemaReserva = z.object({
  servicioId: z.string({ required_error: "Selecciona un servicio." }).min(1, "Selecciona un servicio."),
  fecha: z
    .string({ required_error: "Selecciona una fecha." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)."),
  hora: z
    .string({ required_error: "Selecciona una hora." })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:mm)."),
  notas: z.string().trim().max(500, "Las notas no pueden superar 500 caracteres.").optional().or(z.literal("")),
});

export type DatosReserva = z.infer<typeof esquemaReserva>;

export const esquemaCambioEstado = z.object({
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"]),
  motivoCancelacion: z.string().trim().max(300).optional().or(z.literal("")),
});

export type DatosCambioEstado = z.infer<typeof esquemaCambioEstado>;

/* -------------------------------------------------------------------------- */
/* RF-03 · Parámetros de búsqueda y filtrado                                  */
/* -------------------------------------------------------------------------- */

export const esquemaParametrosServicios = z.object({
  q: z.string().trim().max(120).optional().default(""),
  categoria: z.string().trim().max(60).optional().default(""),
  precioMin: z.coerce.number().min(0).optional(),
  precioMax: z.coerce.number().min(0).optional(),
  duracionMax: z.coerce.number().int().min(0).optional(),
  estado: z.enum(["todos", "activo", "inactivo"]).optional().default("activo"),
  orden: z
    .enum([
      "relevancia",
      "precio-asc",
      "precio-desc",
      "duracion-asc",
      "duracion-desc",
      "nombre-asc",
      "nombre-desc",
      "recientes",
    ])
    .optional()
    .default("relevancia"),
  pagina: z.coerce.number().int().min(1).optional().default(1),
  porPagina: z.coerce.number().int().min(1).max(48).optional().default(9),
});

export type ParametrosServicios = z.infer<typeof esquemaParametrosServicios>;

/* -------------------------------------------------------------------------- */
/* Gestión de usuarios (panel de administración)                                */
/* -------------------------------------------------------------------------- */

export const esquemaActualizarUsuario = z.object({
  rol: z.enum(["USUARIO", "ADMIN"]).optional(),
  activo: z.boolean().optional(),
  nombre: z.string().trim().min(3).max(80).optional(),
  telefono: telefono,
});

export type DatosActualizarUsuario = z.infer<typeof esquemaActualizarUsuario>;

/* Formulario de contacto */
export const esquemaContacto = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio." })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  email,
  asunto: z
    .string({ required_error: "El asunto es obligatorio." })
    .trim()
    .min(3, "El asunto debe tener al menos 3 caracteres.")
    .max(120, "El asunto no puede superar 120 caracteres."),
  mensaje: z
    .string({ required_error: "Escribe tu mensaje." })
    .trim()
    .min(20, "El mensaje debe tener al menos 20 caracteres.")
    .max(2000, "El mensaje no puede superar 2000 caracteres."),
  /* Trampa para robots: el servidor la recibe sin quejarse y descarta el envío. */
  honeypot: z.string().max(200).optional(),
});

export type DatosContacto = z.infer<typeof esquemaContacto>;
