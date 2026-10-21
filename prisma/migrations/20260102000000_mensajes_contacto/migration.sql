-- CreateTable
CREATE TABLE "mensajes_contacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "atendido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mensajes_contacto_atendido_idx" ON "mensajes_contacto"("atendido");
