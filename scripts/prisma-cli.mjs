/**
 * Envoltorio del CLI de Prisma que resuelve el esquema según el proveedor.
 *
 *   node scripts/prisma-cli.mjs push    → sincroniza el esquema (db push)
 *   node scripts/prisma-cli.mjs reset   → reinicia la base de datos (db push --force-reset)
 *   node scripts/prisma-cli.mjs studio  → abre Prisma Studio
 *
 * Como el esquema se resuelve según `DATABASE_PROVIDER`, el mismo comando
 * sirve para el desarrollo local con SQLite y para un entorno PostgreSQL.
 */
import { spawnSync } from "node:child_process";

import { esPostgres, raiz, resolverEsquema, rutaCliPrisma } from "./prisma-esquema.mjs";

const accion = (process.argv[2] ?? "push").toLowerCase();
const esquema = resolverEsquema();

let argumentos;

switch (accion) {
  case "push":
    argumentos = ["db", "push", "--schema", esquema];
    break;
  case "reset":
    argumentos = ["db", "push", "--force-reset", "--schema", esquema];
    break;
  case "studio":
    argumentos = ["studio", "--schema", esquema];
    break;
  default:
    console.error(`Acción desconocida: "${accion}". Usa "push", "reset" o "studio".`);
    process.exit(1);
}

console.log(`→ prisma ${argumentos.slice(0, -1).join(" ")} (esquema: ${esPostgres() ? "postgresql" : "sqlite"})`);

const resultado = spawnSync(process.execPath, [rutaCliPrisma(), ...argumentos], {
  stdio: "inherit",
  cwd: raiz,
});

process.exit(resultado.status ?? 1);
