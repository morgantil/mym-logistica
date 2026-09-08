import { IsUUID } from "class-validator";

// Guia_Desarrollo_Logica_Facturacion_Arbet.docx paso 4/8: combinación
// habilitada de unificación ENTRE dos clientes distintos (ej. Farmaet
// Medicamentos + Farmapal Pañales) — no confundir con un cliente AMBOS
// (Bella Vista), que se unifica solo internamente sin necesitar esto.
export class CrearCombinacionDto {
  @IsUUID()
  clienteMedicamentoId!: string;

  @IsUUID()
  clientePanalId!: string;
}
