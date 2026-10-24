import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { TipoServicio } from "@mym/shared-types";

// Una línea de producto — solo para Pañales (CAMPOS_OBLIGATORIOS exige
// descripcionProducto+cantidad, ver campo-canonico.ts). Medicamentos no
// usa esto: el producto es sintético, se deriva de cantidadBulto/cantidadBolsa.
export class ProductoPedidoManualDto {
  @IsOptional()
  @IsString()
  codigoProducto?: string;

  @IsString()
  @IsNotEmpty()
  descripcionProducto!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

// Alta manual de un pedido (reunión 2026-10-21, Pablo Renzo) — "agregar una
// fila a mano", sin pasar por un Excel. Mismos campos canónicos que ya usa
// el importador (ver campo-canonico.ts); la validación de fondo (afiliado,
// destinatario, dirección, localidad, producto/envase obligatorios) la hace
// la MISMA lógica que valida una fila de Excel — ver
// ImportarExcelService.crearPedidoManual, que arma una fila sintética de
// una sola fila (o una por producto, en Pañales) y la pasa por el pipeline
// real (destinatario, geocodificación, zona/chofer, zona tarifaria — todo
// igual que una importación real), en vez de reimplementar esa lógica.
export class CrearPedidoManualDto {
  @IsUUID()
  clienteId!: string;

  @IsEnum(TipoServicio)
  tipoServicio!: TipoServicio;

  @IsDateString()
  fechaEntrega!: string;

  @IsString()
  @IsNotEmpty()
  numeroAfiliado!: string;

  @IsString()
  @IsNotEmpty()
  destinatario!: string;

  @IsString()
  @IsNotEmpty()
  direccion!: string;

  @IsString()
  @IsNotEmpty()
  localidad!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  ticket?: string;

  // --- Pañales ---
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductoPedidoManualDto)
  productos?: ProductoPedidoManualDto[];

  // --- Medicamentos (campo-canonico.ts, sección "Específicos de medicamentos") ---
  @IsOptional()
  @IsString()
  entreCalles?: string;

  @IsOptional()
  @IsString()
  receta?: string;

  @IsOptional()
  @IsString()
  tipoPedido?: string;

  @IsOptional()
  @IsString()
  retiroDeReceta?: string;

  @IsOptional()
  @IsString()
  tiempoDeEntrega?: string;

  @IsOptional()
  @IsString()
  horarioEntrega?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidadBulto?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidadBolsa?: number;
}
