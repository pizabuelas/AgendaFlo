import type { NextRequest } from "next/server";

import { crearServicio, listarServicios } from "@/lib/services/servicios";
import { esquemaParametrosServicios, esquemaServicio } from "@/lib/validators";
import { obtenerUsuarioActual } from "@/lib/session";
import { creado, errorValidacion, ok } from "@/lib/api-response";

/**
 * GET /api/servicios — Listado con búsqueda, filtros, orden y paginación (RF-03).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const bruto = Object.fromEntries(url.searchParams.entries());

  const validacion = esquemaParametrosServicios.safeParse(bruto);
  if (!validacion.success) {
    return errorValidacion("Parámetros de búsqueda no válidos.");
  }

  const parametros = validacion.data;

  /* Rango de precio compuesto: "50-100" */
  const rangoPrecio = bruto.precio;
  if (rangoPrecio) {
    const [min, max] = rangoPrecio.split("-").map(Number);
    parametros.precioMin = Number.isFinite(min) ? min : undefined;
    parametros.precioMax = max && max > 0 ? max : undefined;
  }

  if (bruto.duracion) parametros.duracionMax = Number(bruto.duracion);

  const usuario = await obtenerUsuarioActual();
  const esAdmin = usuario?.rol === "ADMIN";

  const resultado = await listarServicios(parametros, {
    incluirInactivos: esAdmin && parametros.estado !== "activo",
  });

  return ok(resultado);
}

/**
 * POST /api/servicios — Crea un servicio (RF-02). Solo administradores.
 */
export async function POST(request: NextRequest) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return Response.json(
      { ok: false, mensaje: "Debes iniciar sesión para crear servicios." },
      { status: 401 },
    );
  }

  if (usuario.rol !== "ADMIN") {
    return Response.json(
      { ok: false, mensaje: "Solo los administradores pueden crear servicios." },
      { status: 403 },
    );
  }

  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaServicio.safeParse(cuerpo);
  if (!validacion.success) {
    return errorValidacion(
      "Revisa los datos del servicio.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const servicio = await crearServicio(validacion.data);

  return creado(servicio, "Servicio creado correctamente.");
}
