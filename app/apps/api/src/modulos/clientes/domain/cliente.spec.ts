import { TipoServicioCliente } from "@mym/shared-types";
import { Cliente, detectarClientePorNombreArchivo } from "./cliente";

const CLIENTES: Cliente[] = [
  {
    id: "1",
    nombre: "Biosíntesis",
    patronesDeteccion: ["BIOSINTESIS"],
    activo: true,
    tipoServicio: TipoServicioCliente.PANAL,
  },
  {
    id: "2",
    nombre: "Bella Vista",
    patronesDeteccion: ["BELLA VISTA"],
    activo: true,
    tipoServicio: TipoServicioCliente.AMBOS,
  },
  {
    id: "3",
    nombre: "Farmapal",
    patronesDeteccion: ["FARMAPAL"],
    activo: true,
    tipoServicio: TipoServicioCliente.PANAL,
  },
];

describe("detectarClientePorNombreArchivo", () => {
  it("detecta el cliente sin importar mayúsculas o texto alrededor del patrón", () => {
    const cliente = detectarClientePorNombreArchivo("Grilla_biosintesis_agosto.xlsx", CLIENTES);
    expect(cliente?.id).toBe("1");
  });

  it("devuelve null cuando no matchea ningún patrón conocido — Cliente sin identificar (§5)", () => {
    const cliente = detectarClientePorNombreArchivo("pedidos_random.xlsx", CLIENTES);
    expect(cliente).toBeNull();
  });
});
