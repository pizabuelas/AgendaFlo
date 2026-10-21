import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { Encabezado } from "@/components/layout/Encabezado";
import { PieDePagina } from "@/components/layout/PieDePagina";
import { ProveedorToast } from "@/components/providers/ProveedorToast";
import { obtenerUsuarioActual } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const nombreApp = process.env.NEXT_PUBLIC_APP_NAME ?? "AgendaFlow";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${nombreApp} — Reserva tus citas sin llamadas`,
    template: `%s · ${nombreApp}`,
  },
  description:
    "AgendaFlow es una aplicación web de gestión de citas: explora servicios, comprueba la disponibilidad en tiempo real y confirma tu reserva en segundos.",
  applicationName: nombreApp,
  keywords: ["citas", "reservas", "agenda", "turnos", "servicios", "reservas online"],
  authors: [{ name: "Equipo AgendaFlow" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: `${nombreApp} — Reserva tus citas sin llamadas`,
    description:
      "Explora servicios, comprueba la disponibilidad y confirma tu cita en segundos.",
    siteName: nombreApp,
  },
  twitter: {
    card: "summary_large_image",
    title: `${nombreApp} — Reserva tus citas sin llamadas`,
    description:
      "Explora servicios, comprueba la disponibilidad y confirma tu cita en segundos.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d14" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Script en línea que aplica el tema antes del primer pintado para evitar el
 * parpadeo blanco al recargar en modo oscuro.
 */
const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('agendaflow-tema');var s=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='oscuro'||((!t||t==='sistema')&&s);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas">
        <ProveedorToast>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            Saltar al contenido principal
          </a>

          <Encabezado
            usuario={usuario ? { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } : null}
          />

          <main id="contenido" className="flex-1">
            {children}
          </main>

          <PieDePagina />
        </ProveedorToast>
      </body>
    </html>
  );
}
