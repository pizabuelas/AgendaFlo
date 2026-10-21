import { NextResponse, type NextRequest } from "next/server";

import { NOMBRE_COOKIE_SESION, verificarToken } from "@/lib/jwt";

/**
 * Protección de rutas privadas (RF-01).
 *
 * El middleware comprueba la firma del JWT de la cookie antes de dejar
 * entrar a las áreas privadas. La validación definitiva (usuario activo y
 * sesión no revocada) se hace en el servidor, en `requiereUsuario` y
 * `requiereAdmin`; aquí solo se evita renderizar la página protegida.
 */

const RUTAS_PROTEGIDAS = ["/admin", "/mis-reservas"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const esProtegida = RUTAS_PROTEGIDAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );

  if (!esProtegida) return NextResponse.next();

  const token = request.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const payload = await verificarToken(token);

  if (payload) return NextResponse.next();

  /* Sin sesión válida: se redirige al inicio de sesión conservando la
   * ruta original para volver a ella tras identificarse. */
  const destino = new URL("/login", request.url);
  destino.searchParams.set("redirect", `${pathname}${search}`);

  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/admin/:path*", "/mis-reservas/:path*"],
};
