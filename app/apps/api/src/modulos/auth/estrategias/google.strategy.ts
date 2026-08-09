import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private configService: ConfigService) {
    super({
      // Empty string cuenta como "sin configurar" acá — pasarle "" a OAuth2Strategy
      // rompe el arranque de Nest, así que el placeholder cubre ambos casos.
      clientID: configService.get("google.clientId") || "sin-configurar",
      clientSecret: configService.get("google.clientSecret") || "sin-configurar",
      callbackURL: configService.get("google.callbackUrl"),
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error("Google no devolvió un email para esta cuenta."), undefined);
    }
    done(null, {
      googleId: profile.id,
      email,
      nombre: profile.displayName,
    });
  }
}
