import type { NextRequest } from "next/server";

import { actualizarUsuario } from "@/lib/services/usuarios";
import { esquemaActualizarUsuario } from "@/lib/validators";
import { obtenerUsuarioActual } from "@/lib/session";
import { errorValidacion, noAutorizado, ok } from "@/lib/api-response";

/** PATCH /api/admin/usuarios/[id] — Cambia el rol o el estado de un usuario. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await obtenerUsuarioActual();
  if (!actor) return noAutorizado();
  if (actor.rol !== "ADMIN") {
    return Response.json(
      { ok: false, mensaje: "Solo los administradores pueden modificar usuarios." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaActualizarUsuario.safeParse(cuerpo);
  if (!validacion.success) {
    return errorValidacion(
      "Datos de usuario no válidos.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const resultado = await actualizarUsuario(id, validacion.data, actor.id);

  if (!resultado.ok) {
    return Response.json(
      { ok: false, mensaje: resultado.mensaje },
      { status: resultado.codigo ?? 422 },
    );
  }

  return ok(resultado.datos, resultado.mensaje);
}
