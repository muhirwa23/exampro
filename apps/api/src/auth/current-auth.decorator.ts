import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { AuthRequest, AuthenticatedUser } from "./auth.types.js";

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.auth) throw new UnauthorizedException("Authentication required.");
    return request.auth;
  },
);
