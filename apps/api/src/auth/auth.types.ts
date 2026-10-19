import type { MembershipRole } from "../generated/prisma/enums.js";

export const AUTH_MAILER = Symbol("AUTH_MAILER");

export interface AuthMailer {
  sendVerification(to: string, name: string, url: string): Promise<void>;
  sendPasswordReset(to: string, name: string, url: string): Promise<void>;
}

export interface AuthMembership {
  organizationId: string;
  role: MembershipRole;
  organizationName: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
  memberships: AuthMembership[];
}

export interface AuthRequest {
  headers: {
    cookie?: string;
    "user-agent"?: string;
  };
  ip?: string;
  socket: { remoteAddress?: string };
  auth?: AuthenticatedUser;
}

export interface AuthResponse {
  cookie(name: string, value: string, options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  }): void;
  clearCookie(name: string, options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
  }): void;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: Date | null;
  memberships: AuthMembership[];
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
  user: PublicUser;
}
