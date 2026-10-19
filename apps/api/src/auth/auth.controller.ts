import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AuthGuard, SESSION_COOKIE_NAME } from "./auth.guard.js";
import { CurrentAuth } from "./current-auth.decorator.js";
import { AuthRateLimiter, authRateLimitConfig } from "./auth-rate-limiter.js";
import type { AuthRequest, AuthResponse, AuthenticatedUser } from "./auth.types.js";
import {
  createOrganizationSchema,
  emailSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  tokenSchema,
  ZodBodyPipe,
  type CreateOrganizationInput,
  type EmailInput,
  type ResetPasswordInput,
  type SignUpInput,
  type TokenInput,
} from "./auth.validation.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimiter: AuthRateLimiter,
  ) {}

  @Post("signup")
  @HttpCode(HttpStatus.ACCEPTED)
  async signUp(
    @Body(new ZodBodyPipe(signUpSchema)) body: SignUpInput,
    @Req() request: AuthRequest,
  ) {
    this.consume(request, "signup", this.limits().signUp, body.email);
    return this.authService.signUp(body);
  }

  @Post("email/verify")
  async verifyEmail(
    @Body(new ZodBodyPipe(tokenSchema)) body: TokenInput,
    @Req() request: AuthRequest,
  ) {
    this.consume(request, "verify", this.limits().verify);
    return this.authService.verifyEmail(body.token);
  }

  @Post("email/resend-verification")
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(
    @Body(new ZodBodyPipe(emailSchema)) body: EmailInput,
    @Req() request: AuthRequest,
  ) {
    this.consume(request, "verify", this.limits().verify, body.email);
    return this.authService.resendVerification(body.email);
  }

  @Post("signin")
  async signIn(
    @Body(new ZodBodyPipe(signInSchema)) body: SignInInput,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: AuthResponse,
  ) {
    this.consume(request, "signin", this.limits().signIn, body.email);
    const result = await this.authService.signIn(body.email, body.password, {
      ip: request.ip ?? request.socket.remoteAddress,
      userAgent: request.headers["user-agent"],
    });
    const secure = isSecureCookie();
    response.cookie(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(1, result.expiresAt.getTime() - Date.now()),
    });
    return { user: result.user };
  }

  @Post("signout")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(
    @CurrentAuth() auth: AuthenticatedUser,
    @Res({ passthrough: true }) response: AuthResponse,
  ): Promise<void> {
    await this.authService.signOut(auth.sessionId, auth.userId);
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
    });
  }

  @Post("password-reset/request")
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPasswordReset(
    @Body(new ZodBodyPipe(emailSchema)) body: EmailInput,
    @Req() request: AuthRequest,
  ) {
    this.consume(request, "reset", this.limits().reset, body.email);
    return this.authService.requestPasswordReset(body.email);
  }

  @Post("password-reset/complete")
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body(new ZodBodyPipe(resetPasswordSchema)) body: ResetPasswordInput,
    @Req() request: AuthRequest,
  ): Promise<void> {
    this.consume(request, "reset-complete", this.limits().reset);
    await this.authService.resetPassword(body.token, body.password);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  getMe(@CurrentAuth() auth: AuthenticatedUser) {
    return {
      user: {
        id: auth.userId,
        email: auth.email,
        name: auth.name,
        memberships: auth.memberships,
      },
    };
  }

  @Post("organizations")
  @UseGuards(AuthGuard)
  async createOrganization(
    @Body(new ZodBodyPipe(createOrganizationSchema)) body: CreateOrganizationInput,
    @CurrentAuth() auth: AuthenticatedUser,
  ) {
    return this.authService.createOrganization(auth.userId, body);
  }

  private limits() {
    return authRateLimitConfig();
  }

  private consume(request: AuthRequest, action: string, limit: number, identity = ""): void {
    const address = request.ip ?? request.socket.remoteAddress ?? "unknown-client";
    const windowMs = this.limits().windowMs;
    this.rateLimiter.consume(`${action}:ip`, address, limit, windowMs);
    if (identity) this.rateLimiter.consume(`${action}:identity`, identity, limit, windowMs);
  }
}

type SignInInput = { email: string; password: string };

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production" || process.env.AUTH_COOKIE_SECURE === "true";
}
