/**
 * Ejecuta `prisma generate` con el esquema que corresponde al proveedor
 * configurado en el entorno.
 *
 *   DATABASE_PROVIDER="sqlite"      → prisma/schema.sqlite.prisma
 *   DATABASE_PROVIDER="postgresql"  → prisma/schema.prisma
 *
 * Se ejecuta automáticamente en el `postinstall` y en el `build`, de modo que
 * en Vercel se genera siempre el cliente de PostgreSQL.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { esPostgres, leerVariable, raiz, resolverEsquema, rutaCliPrisma } from "./prisma-esquema.mjs";

/* Sin DATABASE_URL no se puede generar el cliente: avisamos sin romper la
 * instalación (por ejemplo, un `npm install` recién clonado antes de copiar
 * el archivo .env). */
if (!leerVariable("DATABASE_URL")) {
  console.warn(
    "[AgendaFlow] DATABASE_URL no configurada: se omite `prisma generate`.\n" +
      "              Copia .env.example a .env y ejecuta `npm run db:generate`.",
  );
  process.exit(0);
}

const esquema = resolverEsquema();

/* El esquema de SQLite es derivado: lo regeneramos si falta. */
if (!esPostgres() && !existsSync(esquema)) {
  const generador = resolve(raiz, "scripts", "generate-sqlite-schema.mjs");
  const resultado = spawnSync(process.execPath, [generador], { stdio: "inherit" });
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}

console.log(`→ prisma generate (esquema: ${esPostgres() ? "postgresql" : "sqlite"})`);

/* Se invoca el CLI de Prisma a través de Node en lugar del ejecutable de
 * `node_modules/.bin`: así funciona igual en Windows, en macOS y en Linux y
 * no hay que entrecomillar las rutas que contienen espacios. */
const resultado = spawnSync(process.execPath, [rutaCliPrisma(), "generate", "--schema", esquema], {
  stdio: "inherit",
  cwd: raiz,
});

process.exit(resultado.status ?? 1);
