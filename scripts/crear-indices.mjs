/**
 * Crea los índices que Prisma no puede expresar en el esquema.
 *
 * `prisma db push` crea las tablas y los índices declared en el `.prisma`, pero
 * los índices **parciales** (con una cláusula `WHERE`) solo se pueden escribir
 * en SQL. En PostgreSQL los aplica la migración
 * `prisma/migrations/20260103000000_indice_parcial_reservas`; este script cubre
 * la base de datos SQLite del desarrollo local y es idempotente en ambos
 * motores.
 *
 * Uso:  node scripts/crear-indices.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Índice único parcial: dos citas activas del mismo servicio no pueden
 * compartir fecha y hora, pero una cita cancelada sí libera su hueco.
 */
const INDICE_PARCIAL = `
  CREATE UNIQUE INDEX IF NOT EXISTS "reservas_hueco_activo"
    ON "reservas" ("servicioId", "fecha", "hora")
    WHERE "estado" IN ('PENDIENTE', 'CONFIRMADA')
`;

/** Índice heredado del esquema anterior: deja de ser único. */
const INDICE_ANTIGUO = `DROP INDEX IF EXISTS "reservas_servicioId_fecha_hora_key"`;

try {
  await prisma.$executeRawUnsafe(INDICE_ANTIGUO);
  await prisma.$executeRawUnsafe(INDICE_PARCIAL);
  console.log("✓ Índices parciales aplicados sobre la tabla de reservas.");
} catch (error) {
  const mensaje = error instanceof Error ? error.message : String(error);

  if (/no such table|does not exist/i.test(mensaje)) {
    console.warn(
      "· La tabla de reservas todavía no existe; se creará en el siguiente `db push`.",
    );
  } else {
    console.error(`✗ No se pudieron crear los índices parciales: ${mensaje}`);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
