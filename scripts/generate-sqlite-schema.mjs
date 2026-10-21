/**
 * Genera `prisma/schema.sqlite.prisma` a partir de `prisma/schema.prisma`.
 *
 * El esquema de PostgreSQL es la única fuente de verdad. Prisma no permite
 * cambiar el proveedor dinámicamente, así que para el desarrollo local se
 * genera una copia idéntica con `provider = "sqlite"`.
 *
 * Uso:  node scripts/generate-sqlite-schema.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origen = resolve(raiz, "prisma", "schema.prisma");
const destino = resolve(raiz, "prisma", "schema.sqlite.prisma");

if (!existsSync(origen)) {
  console.error(`No se encontró el esquema origen: ${origen}`);
  process.exit(1);
}

const contenido = readFileSync(origen, "utf8");

if (!/provider\s*=\s*"postgresql"/.test(contenido)) {
  console.error(
    'El esquema origen ya no declara provider = "postgresql". Revisa prisma/schema.prisma.',
  );
  process.exit(1);
}

const salida = contenido.replace(
  /provider\s*=\s*"postgresql"/,
  'provider = "sqlite"',
);

writeFileSync(destino, salida, "utf8");
console.log("✓ prisma/schema.sqlite.prisma generado desde prisma/schema.prisma");
