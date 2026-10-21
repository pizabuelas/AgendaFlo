import type { NextRequest } from "next/server";

import { crearMensajeContacto } from "@/lib/services/mensajes";
import { esquemaContacto } from "@/lib/validators";
import { creado, errorValidacion } from "@/lib/api-response";
import { tieneContenidoSignificativo } from "@/lib/utils";

/**
 * POST /api/contacto — Recibe un mensaje del formulario de contacto.
 * Valida la entrada y la persiste; nunca se devuelve el contenido almacenado.
 */
export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);

  const validacion = esquemaContacto.safeParse(cuerpo);

  if (!validacion.success) {
    return errorValidacion(
      "Revisa los datos del mensaje.",
      validacion.error.flatten().fieldErrors,
    );
  }

  /* Trampa para robots (honeypot): si viene relleno se descarta el envío. */
  if (validacion.data.honeypot) {
    return creado(undefined, "Mensaje enviado. Te responderemos lo antes posible.");
  }

  if (!tieneContenidoSignificativo(validacion.data.mensaje)) {
    return errorValidacion("El mensaje debe contener texto.");
  }

  const mensaje = await crearMensajeContacto(validacion.data);

  return creado(
    { id: mensaje.id },
    "Mensaje enviado. Te responderemos lo antes posible.",
  );
}
