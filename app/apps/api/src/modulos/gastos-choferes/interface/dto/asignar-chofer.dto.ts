import { IsString, IsNotEmpty } from "class-validator";

export class AsignarChoferDto {
  @IsString()
  @IsNotEmpty()
  choferId!: string;
}
