import "reflect-metadata";
import { existsSync } from "node:fs";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadConfig } from "./config";

async function bootstrap(): Promise<void> {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.WEB_ORIGIN, credentials: true });
  app.enableShutdownHooks();
  await app.listen(config.PORT);
}

void bootstrap();
