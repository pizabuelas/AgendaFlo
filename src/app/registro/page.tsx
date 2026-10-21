import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormularioRegistro } from "@/components/auth/FormularioRegistro";
import { PantallaAuth } from "@/components/auth/PantallaAuth";
import { obtenerUsuarioActual } from "@/lib/session";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta de AgendaFlow y reserva tu primera cita en minutos.",
};

export default async function PaginaRegistro() {
  const usuario = await obtenerUsuarioActual();
  if (usuario) redirect("/mis-reservas");

  return (
    <PantallaAuth
      titulo="Crea tu cuenta"
      descripcion="Regístrate gratis para reservar, reprogramar y cancelar tus citas cuando quieras."
    >
      <FormularioRegistro />
    </PantallaAuth>
  );
}
