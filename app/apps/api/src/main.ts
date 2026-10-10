import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render (y cualquier PaaS similar) pone la app detrás de un único proxy
  // reverso — sin esto, `req.ip` ve siempre la IP interna del proxy, no la
  // real del cliente, y el rate limiting por IP (ver ThrottlerModule en
  // AppModule) terminaría agrupando a todos los usuarios como si fueran
  // uno solo. "1" = confiar en exactamente UN hop (el proxy de Render), a
  // propósito no `true` (confiar en toda la cadena sin límite es la causa
  // del CVE real de `proxy-addr` que motivó este comentario — ver
  // REPORTE_SEGURIDAD_Y_ROBUSTEZ.md).
  app.set("trust proxy", 1);

  // Headers de seguridad HTTP — mejora 2026-10-10 (ver
  // REPORTE_SEGURIDAD_Y_ROBUSTEZ.md). `contentSecurityPolicy` desactivado:
  // esta API nunca sirve HTML propio (eso lo hace Vercel, otro dominio), el
  // default de helmet está pensado para apps que sí renderizan vistas.
  // `crossOriginResourcePolicy: cross-origin` porque el front (Vercel)
  // descarga blobs de acá (Excel, PDFs de remito/etiqueta) desde otro
  // origen — el default de helmet (`same-origin`) los bloquearía aunque
  // CORS ya los permita (son mecanismos de navegador distintos).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // Necesario para leer la cookie httpOnly del refresh token — ver AuthController.
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:5173",
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MyM Logística API escuchando en http://localhost:${port}`);
}

bootstrap();
