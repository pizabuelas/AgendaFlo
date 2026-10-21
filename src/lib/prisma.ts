import { PrismaClient } from "@prisma/client";

/**
 * Instancia única de Prisma.
 * En desarrollo se guarda en `globalThis` para no abrir un nuevo pool de
 * conexiones en cada recarga en caliente de Next.js.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
