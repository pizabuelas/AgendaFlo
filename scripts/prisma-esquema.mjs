/**
 * Utilidades compartidas por los scripts de Prisma.
 *
 * Determina qué esquema y qué proveedor se usan según el entorno, de modo que
 * los mismos comandos sirvan para el desarrollo local (SQLite) y para el
 * despliegue en PostgreSQL.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Raíz del proyecto. */
export const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Lee una variable del entorno o, si no existe, del archivo `.env` local.
 */
export function leerVariable(nombre) {
  if (process.env[nombre]) return process.env[nombre].trim();

  const envPath = resolve(raiz, ".env");
  if (!existsSync(envPath)) return "";

  const contenido = readFileSync(envPath, "utf8");
  const linea = contenido
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${nombre}=`));

  if (!linea) return "";

  return linea
    .slice(linea.indexOf("=") + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

/** ¿Se está trabajando contra PostgreSQL? */
export function esPostgres() {
  return (leerVariable("DATABASE_PROVIDER") || "sqlite").toLowerCase() === "postgresql";
}

/** Ruta del esquema `.prisma` que corresponde al proveedor configurado. */
export function resolverEsquema() {
  return esPostgres()
    ? resolve(raiz, "prisma", "schema.prisma")
    : resolve(raiz, "prisma", "schema.sqlite.prisma");
}

/** Ruta del CLI de Prisma (sin depender de los `.bin` de Windows). */
export function rutaCliPrisma() {
  return resolve(raiz, "node_modules", "prisma", "build", "index.js");
}
