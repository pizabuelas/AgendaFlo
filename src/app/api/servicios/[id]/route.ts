import type { NextRequest } from "next/server";

import {
  actualizarServicio,
  darDeBajaServicio,
  eliminarServicio,
  obtenerServicioPorId,
  reactivarServicio,
} from "@/lib/services/servicios";
import { esquemaActualizarServicio } from "@/lib/validators";
import { obtenerUsuarioActual } from "@/lib/session";
import { errorValidacion, noAutorizado, noEncontrado, ok } from "@/lib/api-response";

/** GET /api/servicios/[id] — Detalle de un servicio. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const servicio = await obtenerServicioPorId(id);

  if (!servicio) return noEncontrado("El servicio no existe.");
  return ok(servicio);
}

/** PATCH /api/servicios/[id] — Actualiza un servicio. Solo administradores. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();
  if (usuario.rol !== "ADMIN") {
    return Response.json(
      { ok: false, mensaje: "Solo los administradores pueden modificar servicios." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaActualizarServicio.safeParse(cuerpo);
  if (!validacion.success) {
    return errorValidacion(
      "Revisa los datos del servicio.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const servicio = await actualizarServicio(id, validacion.data);
  if (!servicio) return noEncontrado("El servicio no existe.");

  return ok(servicio, "Servicio actualizado correctamente.");
}

/**
 * DELETE /api/servicios/[id] — Da de baja el servicio (baja lógica).
 * Con `?definitivo=true` se elimina de forma definitiva, siempre que no tenga
 * reservas asociadas.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();
  if (usuario.rol !== "ADMIN") {
    return Response.json(
      { ok: false, mensaje: "Solo los administradores pueden dar de baja servicios." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const definitiva = new URL(request.url).searchParams.get("definitivo") === "true";

  if (definitiva) {
    const resultado = await eliminarServicio(id);
    if (!resultado.eliminado) {
      return Response.json(
        {
          ok: false,
          mensaje: `No se puede eliminar: el servicio ${resultado.motivo}.`,
        },
        { status: 409 },
      );
    }
    return ok(undefined, "Servicio eliminado definitivamente.");
  }

  const servicio = await darDeBajaServicio(id).catch(() => null);
  if (!servicio) return noEncontrado("El servicio no existe.");

  return ok(servicio, "Servicio dado de baja.");
}

/** POST /api/servicios/[id]/reactivar — Reactiva un servicio dado de baja. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();
  if (usuario.rol !== "ADMIN") {
    return Response.json(
      { ok: false, mensaje: "Solo los administradores pueden reactivar servicios." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const servicio = await reactivarServicio(id).catch(() => null);
  if (!servicio) return noEncontrado("El servicio no existe.");

  return ok(servicio, "Servicio reactivado.");
}
