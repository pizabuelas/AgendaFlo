"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo } from "@/components/ui/Campos";
import { useToast } from "@/components/providers/ProveedorToast";

/**
 * Formulario de contacto.
 * Valida en el cliente, muestra el estado de envÃ­o y confirma la operaciÃ³n con
 * un aviso en pantalla (RF-05).
 */

interface Errores {
  nombre?: string;
  email?: string;
  asunto?: string;
  mensaje?: string;
}

export function FormularioContacto() {
  const toast = useToast();

  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [enviado, setEnviado] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrores({});
    setEnviando(true);

    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);

    try {
      const respuesta = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.get("nombre"),
          email: datos.get("email"),
          asunto: datos.get("asunto"),
          mensaje: datos.get("mensaje"),
          honeypot: datos.get("sitio_web") ?? "",
        }),
      });

      const cuerpo = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !cuerpo?.ok) {
        setErrores(cuerpo?.errores ?? {});
        throw new Error(cuerpo?.mensaje ?? "No se pudo enviar el mensaje.");
      }

      setEnviado(true);
      formulario.reset();
      toast.exito("Mensaje enviado", cuerpo.mensaje ?? "Te responderemos lo antes posible.");
    } catch (error) {
      toast.error(
        "No se pudo enviar el mensaje",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-success/25 bg-success-soft p-8 text-center"
      >
        <p className="text-base font-semibold text-success">Â¡Gracias por escribirnos!</p>
        <p className="mt-1 text-sm text-ink-muted">
          Hemos registrado tu mensaje y te responderemos en el correo indicado.
        </p>
        <Boton variante="contorno" className="mt-5" onClick={() => setEnviado(false)}>
          Enviar otro mensaje
        </Boton>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="contacto-nombre"
          etiqueta="Nombre"
          requerido
          autoComplete="name"
          error={errores.nombre}
          onChange={() => setErrores((previo) => ({ ...previo, nombre: undefined }))}
        />

        <Campo
          id="contacto-email"
          etiqueta="Correo electrÃ³nico"
          requerido
          type="email"
          autoComplete="email"
          error={errores.email}
          onChange={() => setErrores((previo) => ({ ...previo, email: undefined }))}
        />
      </div>

      <Campo
        id="contacto-asunto"
        etiqueta="Asunto"
        requerido
        error={errores.asunto}
        onChange={() => setErrores((previo) => ({ ...previo, asunto: undefined }))}
      />

      <AreaTexto
        id="contacto-mensaje"
        etiqueta="Mensaje"
        requerido
        rows={6}
        error={errores.mensaje}
        ayuda="CuÃ©ntanos en quÃ© podemos ayudarte (mÃ­nimo 20 caracteres)."
        onChange={() => setErrores((previo) => ({ ...previo, mensaje: undefined }))}
      />

      {/* Trampa para robots: campo oculto que los usuarios no ven. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contacto-sitio-web">Sitio web</label>
        <input id="contacto-sitio-web" name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      <Boton
        type="submit"
        variante="primario"
        tamano="lg"
        cargando={enviando}
        icono={<Send aria-hidden="true" className="size-4" />}
      >
        {enviando ? "Enviandoâ€¦" : "Enviar mensaje"}
      </Boton>
    </form>
  );
}
