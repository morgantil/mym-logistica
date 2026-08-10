import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

// Guarda el HASH del refresh token (nunca el token en texto plano — igual
// criterio que una contraseña: si alguien lee esta tabla, no puede reusar
// las sesiones). SHA-256 alcanza acá porque el refresh token ya es de alta
// entropía (lo genera el JWT, no lo elige un usuario) — no hace falta un hash
// lento tipo Argon2, eso es para secretos de baja entropía como passwords.
@Injectable()
export class SesionesService {
  constructor(private prisma: PrismaService) {}

  private hashear(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async crear(usuarioId: string, refreshToken: string, expiraEn: Date): Promise<void> {
    await this.prisma.sesionRefreshToken.create({
      data: { usuarioId, tokenHash: this.hashear(refreshToken), expiraEn },
    });
  }

  // Válida solo si existe, no está revocada y no venció. La rotación (revocar
  // el token usado) la decide quien llama, después de confirmar que era válido
  // — así un mismo refresh token nunca sirve dos veces.
  async buscarValida(refreshToken: string) {
    const sesion = await this.prisma.sesionRefreshToken.findUnique({
      where: { tokenHash: this.hashear(refreshToken) },
    });
    if (!sesion || sesion.revocadoEn || sesion.expiraEn < new Date()) {
      return null;
    }
    return sesion;
  }

  async revocarPorId(id: string): Promise<void> {
    await this.prisma.sesionRefreshToken.update({
      where: { id },
      data: { revocadoEn: new Date() },
    });
  }

  async revocarToken(refreshToken: string): Promise<void> {
    await this.prisma.sesionRefreshToken.updateMany({
      where: { tokenHash: this.hashear(refreshToken), revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
  }
}
