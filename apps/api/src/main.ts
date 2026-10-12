import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap().catch((error: unknown) => {
  console.error("API bootstrap failed", error);
  process.exitCode = 1;
});
