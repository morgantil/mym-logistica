// Script de un solo uso para recrear el usuario de login. Correlo desde acá
// (apps/api) con: node crear-usuario-qa.js
// Después lo podés borrar, no forma parte del código de la app.
const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("QaFacturacion2026!");
  const usuario = await prisma.usuario.create({
    data: {
      email: "qa-facturacion@mym.test",
      nombre: "QA Facturación",
      passwordHash,
      roles: ["OPERACIONES", "LOGISTICA", "ADMINISTRACION", "FACTURACION"],
      activo: true,
    },
  });
  console.log("Usuario creado:", usuario.email, usuario.roles);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
