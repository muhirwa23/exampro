import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AUTH_MAILER } from "./auth.types.js";
import { AuthController } from "./auth.controller.js";
import { AuthGuard } from "./auth.guard.js";
import { AuthRateLimiter } from "./auth-rate-limiter.js";
import { AuthService } from "./auth.service.js";
import { SmtpAuthMailer } from "./smtp-auth-mailer.js";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    AuthRateLimiter,
    SmtpAuthMailer,
    { provide: AUTH_MAILER, useExisting: SmtpAuthMailer },
  ],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
