-- Mapeo Zona de SimpliRoute (id numérico real) -> ZonaTarifaria (Cordón),
-- alternativa más liviana al mapeo Localidad -> Cordón (11 zonas reales en
-- vez de cientos de localidades).
CREATE TABLE "zonas_simpliroute_zonas_tarifarias" (
    "zonaSimpliRouteId" INTEGER NOT NULL,
    "zonaTarifariaId" TEXT NOT NULL,

    CONSTRAINT "zonas_simpliroute_zonas_tarifarias_pkey" PRIMARY KEY ("zonaSimpliRouteId")
);

ALTER TABLE "zonas_simpliroute_zonas_tarifarias"
  ADD CONSTRAINT "zonas_simpliroute_zonas_tarifarias_zonaTarifariaId_fkey"
  FOREIGN KEY ("zonaTarifariaId") REFERENCES "zonas_tarifarias"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
