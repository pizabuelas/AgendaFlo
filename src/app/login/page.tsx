import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { FormularioLogin } from "@/components/auth/FormularioLogin";
import { PantallaAuth } from "@/components/auth/PantallaAuth";
import { Esqueleto } from "@/components/ui/Tarjeta";
import { obtenerUsuarioActual } from "@/lib/session";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de AgendaFlow para gestionar tus citas.",
};

export default async function PaginaLogin() {
  const usuario = await obtenerUsuarioActual();
  if (usuario) redirect("/mis-reservas");

  return (
    <PantallaAuth
      titulo="Iniciar sesión"
      descripcion="Accede a tu panel para ver tus citas, gestionarlas y consultar tu historial."
    >
      <Suspense fallback={<Esqueleto className="h-64 w-full" />}>
        <FormularioLogin />
      </Suspense>
    </PantallaAuth>
  );
}
