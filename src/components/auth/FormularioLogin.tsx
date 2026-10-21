"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { useToast } from "@/components/providers/ProveedorToast";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campos";
import { Aviso } from "@/components/ui/Tarjeta";

/** Formulario de inicio de sesión (RF-01). */
export function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string[]>>({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    setErroresCampos({});

    try {
      const respuesta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setError(cuerpo.mensaje ?? "No se ha podido iniciar sesión.");
        setErroresCampos(cuerpo.errores ?? {});
        return;
      }

      toast.exito("¡Sesión iniciada!", `Bienvenido de nuevo, ${cuerpo.datos?.nombre ?? ""}.`);

      const destino = parametros.get("redirect") ?? "/mis-reservas";
      router.push(destino);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      {error ? <Aviso tono="peligro">{error}</Aviso> : null}

      <Campo
        id="email"
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        requerido
        value={email}
        onChange={(evento) => setEmail(evento.target.value)}
        error={erroresCampos.email?.[0]}
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Contraseña
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <Link
            href="/contacto"
            className="text-xs font-medium text-brand-600 transition hover:underline"
          >
            ¿Has olvidado la contraseña?
          </Link>
        </div>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            aria-invalid={erroresCampos.password ? true : undefined}
            aria-describedby={erroresCampos.password ? "password-error" : undefined}
            className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 pr-11 text-sm text-ink transition placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
          <button
            type="button"
            onClick={() => setVerPassword((visible) => !visible)}
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-subtle transition hover:text-ink"
          >
            {verPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>

        {erroresCampos.password?.[0] ? (
          <p id="password-error" role="alert" className="text-xs font-medium text-danger">
            {erroresCampos.password[0]}
          </p>
        ) : null}
      </div>

      <Boton
        type="submit"
        variante="primario"
        tamano="lg"
        anchoCompleto
        cargando={enviando}
        icono={<LogIn aria-hidden="true" className="size-4" />}
      >
        Iniciar sesión
      </Boton>

      <p className="text-center text-sm text-ink-muted">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-brand-600 hover:underline">
          Crear una cuenta gratis
        </Link>
      </p>

      <div className="rounded-xl border border-line bg-surface-muted p-4 text-xs leading-relaxed text-ink-muted">
        <p className="font-semibold text-ink">Cuentas de demostración</p>
        <p className="mt-1">
          Administrador: <code className="font-mono text-ink">admin@agendaflow.dev</code> ·{" "}
          <code className="font-mono text-ink">Admin1234</code>
        </p>
        <p>
          Usuario: <code className="font-mono text-ink">usuario@agendaflow.dev</code> ·{" "}
          <code className="font-mono text-ink">Usuario1234</code>
        </p>
      </div>
    </form>
  );
}
