import type { NextRequest } from "next/server";

import { listarUsuarios } from "@/lib/services/usuarios";
import { obtenerUsuarioActual } from "@/lib/session";
import { noAutorizado, ok } from "@/lib/api-response";

/** GET /api/admin/usuarios — Listado de usuarios (solo administradores). */
export async function GET(request: NextRequest) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return noAutorizado();
  if (usuario.rol !== "ADMIN") {
    return Response.json(
      { ok: false, mensaje: "Solo los administradores pueden consultar los usuarios." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const rol = url.searchParams.get("rol");

  const resultado = await listarUsuarios({
    q: url.searchParams.get("q") ?? "",
    rol:
      rol === "ADMIN" || rol === "USUARIO" ? (rol as "ADMIN" | "USUARIO") : "todos",
    pagina: Number(url.searchParams.get("pagina") ?? 1),
    porPagina: Number(url.searchParams.get("porPagina") ?? 10),
  });

  return ok(resultado);
}
