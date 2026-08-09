import { Controller, Get } from "@nestjs/common";
import { ZonasChoferesService } from "../application/zonas-choferes.service";

@Controller()
export class ZonasChoferesController {
  constructor(private service: ZonasChoferesService) {}

  @Get("zonas")
  listarZonas() {
    return this.service.listarZonas();
  }

  @Get("choferes")
  listarChoferes() {
    return this.service.listarChoferes();
  }
}
