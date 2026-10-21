import { NextResponse } from "next/server";

/**
 * Respuestas JSON homogéneas para toda la API REST.
 * Formato: `{ ok: boolean, mensaje?: string, datos?: unknown, errores?: Record<string, string[]> }`
 */

export interface RespuestaOk<T> {
  ok: true;
  mensaje?: string;
  datos?: T;
}

export interface RespuestaError {
  ok: false;
  mensaje: string;
  errores?: Record<string, string[]>;
}

export type Respuesta<T> = RespuestaOk<T> | RespuestaError;

/** 200 — operación correcta. */
export function ok<T>(datos?: T, mensaje?: string, estado = 200) {
  return NextResponse.json<RespuestaOk<T>>(
    { ok: true, ...(datos !== undefined ? { datos } : {}), ...(mensaje ? { mensaje } : {}) },
    { status: estado },
  );
}

/** 201 — recurso creado. */
export function creado<T>(datos?: T, mensaje?: string) {
  return ok(datos, mensaje, 201);
}

/** 400 — error de validación con el detalle por campo. */
export function errorValidacion(
  mensaje: string,
  errores?: Record<string, string[]>,
) {
  return NextResponse.json<RespuestaError>(
    { ok: false, mensaje, ...(errores ? { errores } : {}) },
    { status: 400 },
  );
}

/** 401 — no autenticado. */
export function noAutorizado(mensaje = "Debes iniciar sesión para continuar.") {
  return NextResponse.json<RespuestaError>({ ok: false, mensaje }, { status: 401 });
}

/** 403 — autenticado pero sin permisos. */
export function prohibido(mensaje = "No tienes permisos para realizar esta acción.") {
  return NextResponse.json<RespuestaError>({ ok: false, mensaje }, { status: 403 });
}

/** 404 — recurso inexistente. */
export function noEncontrado(mensaje = "No se encontró el recurso solicitado.") {
  return NextResponse.json<RespuestaError>({ ok: false, mensaje }, { status: 404 });
}

/** 409 — conflicto con el estado actual. */
export function conflicto(mensaje: string) {
  return NextResponse.json<RespuestaError>({ ok: false, mensaje }, { status: 409 });
}

/** 422 — la operación es válida pero el negocio la rechaza. */
export function noProcesable(mensaje: string) {
  return NextResponse.json<RespuestaError>({ ok: false, mensaje }, { status: 422 });
}

/** 500 — error inesperado. */
export function errorInterno(mensaje = "Ocurrió un error inesperado. Inténtalo de nuevo.") {
  return NextResponse.json<RespuestaError>({ ok: false, mensaje }, { status: 500 });
}
