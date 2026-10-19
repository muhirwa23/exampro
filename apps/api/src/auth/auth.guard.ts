import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import type { AuthRequest, AuthenticatedUser } from "./auth.types.js";

export const SESSION_COOKIE_NAME = "trustexam_session";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const rawToken = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    if (!rawToken) throw new UnauthorizedException("Authentication required.");
    const authenticated = await this.authService.authenticateSession(rawToken);
    if (!authenticated) throw new UnauthorizedException("Authentication required.");
    request.auth = {
      userId: authenticated.user.id,
      email: authenticated.user.email,
      name: authenticated.user.name,
      sessionId: authenticated.sessionId,
      memberships: authenticated.user.memberships,
    } satisfies AuthenticatedUser;
    return true;
  }
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      const decoded = decodeURIComponent(value);
      return decoded && decoded.length <= 128 ? decoded : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
