import { ArrayMaxSize, IsArray, IsString } from "class-validator";

// Ids de columna de la grilla de Pedidos que el usuario fijó como
// importantes, en el orden que las fue marcando — ver pedidos-tabla.tsx en
// el frontend para la lista de ids válidos. No se valida contra una lista
// fija acá: si el frontend cambia los ids de columna en el futuro, un id
// viejo guardado simplemente no matchea ninguna columna real y se ignora
// al renderizar, no rompe nada.
export class ActualizarColumnasPedidosDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  columnas!: string[];
}
