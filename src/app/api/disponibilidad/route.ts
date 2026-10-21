import type { NextRequest } from "next/server";

import { obtenerDisponibilidad } from "@/lib/services/reservas";
import { errorValidacion, ok } from "@/lib/api-response";

/**
 * GET /api/disponibilidad?servicioId=…&fecha=AAAA-MM-DD
 * Devuelve los huecos del servicio en la fecha indicada (RF-04).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const servicioId = url.searchParams.get("servicioId") ?? "";
  const fecha = url.searchParams.get("fecha") ?? "";

  if (!servicioId || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return errorValidacion("Indica un servicio válido y una fecha con formato AAAA-MM-DD.");
  }

  const huecos = await obtenerDisponibilidad(servicioId, fecha);

  return ok({
    fecha,
    servicioId,
    huecos,
    disponibles: huecos.filter((hueco) => hueco.disponible).length,
  });
}
