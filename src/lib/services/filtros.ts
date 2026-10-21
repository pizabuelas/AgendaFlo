import type { Prisma } from "@prisma/client";

/**
 * Utilidades compartidas para construir filtros de búsqueda por texto
 * (RF-03) que funcionan igual en PostgreSQL y en SQLite.
 *
 * PostgreSQL distingue mayúsculas y minúsculas en las comparaciones `LIKE`,
 * por lo que necesita `mode: "insensitive"`. SQLite ya compara sin
 * distinguir mayúsculas para el conjunto ASCII. Como el cliente de Prisma se
 * genera a partir del esquema del proveedor activo, el campo `mode` no existe
 * en los tipos de SQLite: el filtro se declara aquí con ese campo opcional
 * para que el mismo código compile y funcione en ambos entornos.
 */

const esPostgres = process.env.DATABASE_PROVIDER === "postgresql";

/** Filtro de coincidencia parcial sobre un campo de texto. */
export type FiltroTexto = Prisma.StringFilter & { mode?: "insensitive" };

/**
 * Construye un filtro `contains` para buscar por palabra clave.
 * Devuelve el filtro con `mode: "insensitive"` solo cuando el proveedor
 * activo es PostgreSQL.
 */
export function filtroTexto(texto: string): FiltroTexto {
  const filtro: FiltroTexto = esPostgres
    ? { contains: texto, mode: "insensitive" }
    : { contains: texto };

  return filtro;
}
