export default () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  redisUrl: process.env.REDIS_URL,
  simpliroute: {
    apiUrl: process.env.SIMPLIROUTE_API_URL,
    apiKey: process.env.SIMPLIROUTE_API_KEY,
    mock: process.env.SIMPLIROUTE_MOCK !== "false",
    // Punto de partida/llegada dummy para crear una Route cuando hace falta
    // (ver SimplirouteHttpAdapter.asignarChoferVehiculo) — SimpliRoute lo
    // exige para crear una Route aunque no tengamos un depósito real
    // configurado. Default: Obelisco, CABA — placeholder razonable hasta que
    // Leonardo confirme la dirección real del depósito de MyM.
    depositoDireccion: process.env.SIMPLIROUTE_DEPOSITO_DIRECCION ?? "CABA, Argentina",
    depositoLatitud: Number(process.env.SIMPLIROUTE_DEPOSITO_LATITUD ?? "-34.6037"),
    depositoLongitud: Number(process.env.SIMPLIROUTE_DEPOSITO_LONGITUD ?? "-58.3816"),
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
  },
});
