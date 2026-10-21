/**
 * Ejecuta `prisma db seed` contra el proveedor configurado.
 *
 * El comando `prisma db seed` necesita un esquema coherente con `DATABASE_URL`:
 * usar el esquema de SQLite en un despliegue con PostgreSQL (o al revés) hace
 * que Prisma rechace la operación. Este script resuelve el esquema correcto y
 * delega en el CLI.
 *
 * Uso:  node scripts/prisma-seed.mjs
 */
import { spawnSync } from "node:child_process";

import { esPostgres, raiz, resolverEsquema, rutaCliPrisma } from "./prisma-esquema.mjs";

const esquema = resolverEsquema();

console.log(`→ prisma db seed (esquema: ${esPostgres() ? "postgresql" : "sqlite"})`);

const resultado = spawnSync(
  process.execPath,
  [rutaCliPrisma(), "db", "seed", "--schema", esquema],
  { stdio: "inherit", cwd: raiz },
);

process.exit(resultado.status ?? 1);
