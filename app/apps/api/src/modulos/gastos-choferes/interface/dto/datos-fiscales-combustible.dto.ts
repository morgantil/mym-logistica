import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";

// Campos del comprobante fiscal de Combustible (item 14.1, error real
// corregido 2026-10-07 — ver comentario en gasto-chofer.ts) — compartidos
// entre crear y actualizar un gasto a mano, todos opcionales (solo tienen
// sentido para Combustible, nunca para Peaje).
export class DatosFiscalesCombustibleDto {
  @IsOptional()
  @IsDateString()
  fechaRecepcion?: string;

  @IsOptional()
  @IsString()
  comprobanteCodigo?: string;

  @IsOptional()
  @IsString()
  comprobanteTipo?: string;

  @IsOptional()
  @IsString()
  comprobanteSucursal?: string;

  @IsOptional()
  @IsString()
  comprobanteNumero?: string;

  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  cuit?: string;

  @IsOptional()
  @IsString()
  domicilio?: string;

  @IsOptional()
  @IsString()
  codigoPostal?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  condicionFiscal?: string;

  @IsOptional()
  @IsString()
  codigoNeto?: string;

  @IsOptional()
  @IsNumber()
  netoGravado?: number;

  @IsOptional()
  @IsNumber()
  alicuota?: number;

  @IsOptional()
  @IsNumber()
  ivaLiquidado?: number;

  @IsOptional()
  @IsNumber()
  ivaCredito?: number;

  @IsOptional()
  @IsString()
  codigoNgEx?: string;

  @IsOptional()
  @IsNumber()
  conceptosNgEx?: number;

  @IsOptional()
  @IsString()
  codigoPR?: string;

  @IsOptional()
  @IsNumber()
  percepcionRetencion?: number;

  @IsOptional()
  @IsString()
  provinciaPR?: string;
}
