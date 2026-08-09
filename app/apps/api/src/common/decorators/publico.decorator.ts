import { SetMetadata } from "@nestjs/common";

export const PUBLICO_KEY = "publico";

// Uso: @Publico() en un endpoint para saltear el JwtAuthGuard global (ej. /auth/login).
export const Publico = () => SetMetadata(PUBLICO_KEY, true);
