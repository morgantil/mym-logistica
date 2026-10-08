import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { GastosChoferesController } from "./gastos-choferes.controller";

// Bug real 2026-10-07 (reunión, encontrado por Leonardo probando "Nuevo
// gasto" en producción — 500 crudo): un Edit mal targeteado dejó el
// decorador @Post() pegado al método `extraerDatosFiscales` (un helper
// privado, sin @Body()) en vez de `crear` — Nest mapeaba esa ruta a un
// método que Nest llamaba sin argumentos, crasheando al primer acceso a
// `dto.fechaRecepcion`. Nada en los tests de servicio lo detectaba porque
// el bug era puramente de metadata de ruteo, no de lógica. Este test lee esa
// metadata directo (sin levantar un server HTTP) para que una futura edición
// mal targeteada rompa el test, no la demo en vivo de Leonardo.
describe("GastosChoferesController — metadata de rutas", () => {
  it("POST /gastos-choferes está mapeado a crear(), no a un método auxiliar", () => {
    const metodo = Reflect.getMetadata(METHOD_METADATA, GastosChoferesController.prototype.crear);
    const ruta = Reflect.getMetadata(PATH_METADATA, GastosChoferesController.prototype.crear);
    expect(metodo).toBe(RequestMethod.POST);
    expect(ruta).toBe("/");
  });

  it("extraerDatosFiscales (helper privado) no tiene metadata de ruta propia", () => {
    const metodo = Reflect.getMetadata(
      METHOD_METADATA,
      (GastosChoferesController.prototype as never)["extraerDatosFiscales"],
    );
    expect(metodo).toBeUndefined();
  });
});
