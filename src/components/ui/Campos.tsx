import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Campos de formulario accesibles.
 * Cada control asocia su etiqueta, su ayuda y su error mediante `id`,
 * `aria-describedby` y `aria-invalid`.
 */

interface BaseCampo {
  etiqueta?: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  className?: string;
}

const clasesControl =
  "w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition placeholder:text-ink-subtle " +
  "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle";

const clasesInvalido = "border-danger focus:border-danger focus:ring-danger/15";

/** Contenedor común de etiqueta + control + mensajes. */
function Envoltorio({
  id,
  etiqueta,
  ayuda,
  error,
  requerido,
  children,
  className,
}: BaseCampo & { id: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {etiqueta ? (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {etiqueta}
          {requerido ? (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-xs text-ink-subtle">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface CampoProps extends BaseCampo, Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
}

export function Campo({ etiqueta, ayuda, error, requerido, className, id, ...props }: CampoProps) {
  const descrito = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;

  return (
    <Envoltorio id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={requerido} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descrito}
        className={cn(clasesControl, "h-11", error && clasesInvalido)}
        {...props}
      />
    </Envoltorio>
  );
}

/* -------------------------------------------------------------------------- */

export interface AreaTextoProps
  extends BaseCampo,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
}

export function AreaTexto({
  etiqueta,
  ayuda,
  error,
  requerido,
  className,
  id,
  rows = 4,
  ...props
}: AreaTextoProps) {
  const descrito = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;

  return (
    <Envoltorio id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={requerido} className={className}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={descrito}
        className={cn(clasesControl, "resize-y py-2.5 leading-relaxed", error && clasesInvalido)}
        {...props}
      />
    </Envoltorio>
  );
}

/* -------------------------------------------------------------------------- */

export interface SelectorProps
  extends BaseCampo,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  opciones: Array<{ valor: string; etiqueta: string }>;
  marcador?: string;
}

export function Selector({
  etiqueta,
  ayuda,
  error,
  requerido,
  className,
  id,
  opciones,
  marcador,
  ...props
}: SelectorProps) {
  const descrito = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;

  return (
    <Envoltorio id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={requerido} className={className}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descrito}
        className={cn(
          clasesControl,
          "h-11 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat pr-10",
          error && clasesInvalido,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b6070' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {marcador ? <option value="">{marcador}</option> : null}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </Envoltorio>
  );
}

/* -------------------------------------------------------------------------- */

/** Casilla de verificación con etiqueta accesible. */
export interface CasillaProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id: string;
  etiqueta: string;
  error?: string;
}

export function Casilla({ id, etiqueta, error, className, ...props }: CasillaProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "mt-0.5 size-4.5 shrink-0 cursor-pointer rounded border-line-strong text-brand-600 accent-brand-600",
            "focus:ring-4 focus:ring-brand-500/15 focus:outline-none",
            error && "border-danger",
          )}
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-sm text-ink-muted">
          {etiqueta}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
