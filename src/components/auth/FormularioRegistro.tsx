"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, UserPlus, X } from "lucide-react";

import { useToast } from "@/components/providers/ProveedorToast";
import { Boton } from "@/components/ui/Boton";
import { Campo, Casilla } from "@/components/ui/Campos";
import { Aviso } from "@/components/ui/Tarjeta";
import { REGLAS_PASSWORD } from "@/lib/password";
import { cn } from "@/lib/utils";

/** Formulario de registro de usuarios (RF-01). */
export function FormularioRegistro() {
  const router = useRouter();
  const toast = useToast();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string[]>>({});
  const [enviando, setEnviando] = useState(false);

  const evaluacion = useMemo(
    () =>
      REGLAS_PASSWORD.map((regla) => ({
        ...regla,
        cumplida: regla.ok(password),
      })),
    [password],
  );

  const reglasCumplidas = evaluacion.filter((regla) => regla.cumplida).length;
  const fuerza = Math.round((reglasCumplidas / REGLAS_PASSWORD.length) * 100);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    setErroresCampos({});

    try {
      const respuesta = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
          confirmPassword,
          telefono,
          aceptarTerminos,
        }),
      });

      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setError(cuerpo.mensaje ?? "No se ha podido crear la cuenta.");
        setErroresCampos(cuerpo.errores ?? {});
        return;
      }

      toast.exito("¡Cuenta creada!", "Ya puedes reservar tu primera cita.");
      router.push("/mis-reservas");
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
        id="nombre"
        etiqueta="Nombre completo"
        autoComplete="name"
        placeholder="Ana Torres"
        requerido
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        error={erroresCampos.nombre?.[0]}
      />

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

      <Campo
        id="telefono"
        etiqueta="Teléfono"
        type="tel"
        autoComplete="tel"
        placeholder="+34 600 000 000"
        ayuda="Opcional. Lo usaremos solo para avisarte de tus citas."
        value={telefono}
        onChange={(evento) => setTelefono(evento.target.value)}
        error={erroresCampos.telefono?.[0]}
      />

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Contraseña
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            aria-invalid={erroresCampos.password ? true : undefined}
            aria-describedby="reglas-password"
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

        {/* Medidor de seguridad de la contraseña */}
        <div id="reglas-password" className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-strong">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  fuerza >= 100
                    ? "bg-success"
                    : fuerza >= 60
                      ? "bg-warning"
                      : "bg-danger",
                )}
                style={{ width: `${fuerza}%` }}
              />
            </div>
            <span className="w-24 text-right text-xs font-medium text-ink-muted">
              {password.length === 0
                ? "Sin contraseña"
                : fuerza >= 100
                  ? "Segura"
                  : fuerza >= 60
                    ? "Aceptable"
                    : "Débil"}
            </span>
          </div>

          <ul className="grid gap-1 sm:grid-cols-2">
            {evaluacion.map((regla) => (
              <li
                key={regla.id}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  regla.cumplida ? "text-success" : "text-ink-subtle",
                )}
              >
                {regla.cumplida ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : (
                  <X aria-hidden="true" className="size-3.5" />
                )}
                {regla.mensaje}
              </li>
            ))}
          </ul>
        </div>

        {erroresCampos.password?.[0] ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {erroresCampos.password[0]}
          </p>
        ) : null}
      </div>

      <Campo
        id="confirmPassword"
        etiqueta="Confirmar contraseña"
        type={verPassword ? "text" : "password"}
        autoComplete="new-password"
        requerido
        value={confirmPassword}
        onChange={(evento) => setConfirmPassword(evento.target.value)}
        error={erroresCampos.confirmPassword?.[0]}
      />

      <div className="space-y-1.5">
        <Casilla
          id="aceptarTerminos"
          etiqueta="Acepto los términos y condiciones y la política de privacidad."
          checked={aceptarTerminos}
          onChange={(evento) => setAceptarTerminos(evento.target.checked)}
          error={erroresCampos.aceptarTerminos?.[0]}
        />
      </div>

      <Boton
        type="submit"
        variante="primario"
        tamano="lg"
        anchoCompleto
        cargando={enviando}
        icono={<UserPlus aria-hidden="true" className="size-4" />}
      >
        Crear mi cuenta
      </Boton>

      <p className="text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
