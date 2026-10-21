-- Se relaja la restricción única completa del hueco reservado.
--
-- Con `UNIQUE (servicioId, fecha, hora)` un hueco cancelado quedaba bloqueado
-- para siempre: la agenda lo ofrecía como libre y la reserva devolvía 409.
--
-- La garantía de no sobre-reservar se mantiene con un índice único parcial
-- que solo cubre las citas activas, de modo que una cita confirmada, otra
-- pendiente o una cancelada pueden convivir en el mismo hueco.
DROP INDEX IF EXISTS "reservas_servicioId_fecha_hora_key";

CREATE UNIQUE INDEX IF NOT EXISTS "reservas_hueco_activo"
  ON "reservas" ("servicioId", "fecha", "hora")
  WHERE "estado" IN ('PENDIENTE', 'CONFIRMADA');
