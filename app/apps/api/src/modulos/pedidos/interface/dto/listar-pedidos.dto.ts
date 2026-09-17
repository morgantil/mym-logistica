import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDate, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { EstadoPedido, EstadoSimpliroute, TipoEnvase, TipoServicio } from "@mym/shared-types";
import { CampoOrdenPedido } from "../../domain/pedidos.repositorio";

// Whitelist explícita para el DTO — mismos valores que CampoOrdenPedido, acá
// duplicados como array porque @IsIn necesita un valor en tiempo de
// ejecución, no solo un tipo.
const CAMPOS_ORDEN: CampoOrdenPedido[] = [
  "cliente",
  "estado",
  "numero",
  "afiliado",
  "destinatario",
  "telefono",
  "direccion",
  "localidad",
  "fecha",
  "fechaSubida",
  "bultos",
  "zona",
  "chofer",
  "validacion",
  "simpliroute",
  "observaciones",
];

// `clienteId`/`fechaDesde`/`fechaHasta` los usa la pantalla de Embalaje y
// Despacho (§8.1 funcional v6) — el filtrado por "qué clientes puede ver
// este usuario" lo sigue aplicando PedidosService.listarParaUsuario vía
// PermisosClienteService, cruzado con `clienteId` si viene.
export class ListarPedidosDto {
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaDesde?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaHasta?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bultosDesde?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bultosHasta?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  busqueda?: string;

  // Filtros combinables agregados 2026-09-16 — ver FiltroPedidos.
  @IsOptional()
  @IsEnum(TipoServicio)
  tipoServicio?: TipoServicio;

  @IsOptional()
  @IsString()
  zonaId?: string;

  @IsOptional()
  @IsString()
  choferId?: string;

  @IsOptional()
  @IsEnum(TipoEnvase)
  tipoEnvase?: TipoEnvase;

  @IsOptional()
  @IsEnum(EstadoSimpliroute)
  estadoSimpliroute?: EstadoSimpliroute;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  localidad?: string;

  // Query param llega como string ("true"/"false") — Boolean("false") daría
  // true, por eso el Transform explícito en vez de @Type(() => Boolean).
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  sinEtiquetaImpresa?: boolean;

  @IsOptional()
  @IsIn(CAMPOS_ORDEN)
  ordenarPor?: CampoOrdenPedido;

  @IsOptional()
  @IsIn(["asc", "desc"])
  direccionOrden?: "asc" | "desc";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200) // sin techo, un cliente del API podía pedir todo de una y anular la paginación
  porPagina: number = 50;
}
