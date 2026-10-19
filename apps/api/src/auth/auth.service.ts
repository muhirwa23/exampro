import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import argon2 from "argon2";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { AuthTokenPurpose, MembershipRole, Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AUTH_MAILER, type AuthMailer, type CreatedSession, type PublicUser } from "./auth.types.js";
import type { CreateOrganizationInput, SignUpInput } from "./auth.validation.js";

const GENERIC_EMAIL_RESPONSE = { message: "If the account is eligible, an email will be sent shortly." };
const INVALID_CREDENTIALS = "Email, password, or verification status is invalid.";
const INVALID_TOKEN = "The link is invalid or has expired.";
const SESSION_COOKIE_TTL_SECONDS = 8 * 60 * 60;
const fingerprintKey = randomBytes(32);

type UserWithMemberships = Prisma.UserGetPayload<{
  include: { memberships: { include: { organization: { select: { name: true } } } } };
}>;
type MembershipForAudit = { organizationId: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private dummyPasswordHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_MAILER) private readonly mailer: AuthMailer,
  ) {}

  async signUp(input: SignUpInput): Promise<typeof GENERIC_EMAIL_RESPONSE> {
    const email = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);
    const rawToken = newOpaqueToken();
    const now = new Date();
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { name: input.organizationName, ...(input.country ? { country: input.country } : {}) },
        });
        const createdUser = await tx.user.create({
          data: { email, name: input.name, passwordHash },
        });
        await tx.membership.create({
          data: { userId: createdUser.id, organizationId: organization.id, role: MembershipRole.ORG_OWNER },
        });
        await insertAuthToken(tx, createdUser.id, AuthTokenPurpose.EMAIL_VERIFICATION, rawToken, verificationExpiry(now));
        await tx.auditLog.createMany({
          data: [
            auditRecord(organization.id, createdUser.id, "auth.signup", "User", createdUser.id, { source: "web" }),
            auditRecord(organization.id, createdUser.id, "organization.created", "Organization", organization.id, { source: "signup" }),
          ],
        });
        return createdUser;
      });
      void this.deliver(() => this.mailer.sendVerification(user.email, user.name, this.publicLink("verify-email", rawToken)));
    } catch (error) {
      if (isUniqueConstraintError(error)) return GENERIC_EMAIL_RESPONSE;
      throw error;
    }
    return GENERIC_EMAIL_RESPONSE;
  }

  async resendVerification(emailInput: string): Promise<typeof GENERIC_EMAIL_RESPONSE> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(emailInput) },
      include: { memberships: true },
    });
    if (!user || user.emailVerifiedAt) return GENERIC_EMAIL_RESPONSE;
    const rawToken = newOpaqueToken();
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.authToken.updateMany({
        where: { userId: user.id, purpose: AuthTokenPurpose.EMAIL_VERIFICATION, consumedAt: null },
        data: { consumedAt: now },
      });
      await insertAuthToken(tx, user.id, AuthTokenPurpose.EMAIL_VERIFICATION, rawToken, verificationExpiry(now));
      await writeAuditForMemberships(tx, user.memberships, user.id, "auth.email_verification_resent", "User", user.id);
    });
    void this.deliver(() => this.mailer.sendVerification(user.email, user.name, this.publicLink("verify-email", rawToken)));
    return GENERIC_EMAIL_RESPONSE;
  }

  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    const now = new Date();
    const tokenHash = hashToken(rawToken);
    await this.prisma.$transaction(async (tx) => {
      const record = await tx.authToken.findUnique({
        where: { tokenHash },
        include: { user: { include: { memberships: true } } },
      });
      if (!record || record.purpose !== AuthTokenPurpose.EMAIL_VERIFICATION || record.consumedAt || record.expiresAt <= now) {
        throw new BadRequestException(INVALID_TOKEN);
      }
      const consumed = await tx.authToken.updateMany({
        where: { id: record.id, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) throw new BadRequestException(INVALID_TOKEN);
      await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: record.user.emailVerifiedAt ?? now } });
      await tx.authToken.updateMany({
        where: { userId: record.userId, purpose: AuthTokenPurpose.EMAIL_VERIFICATION, consumedAt: null },
        data: { consumedAt: now },
      });
      await writeAuditForMemberships(tx, record.user.memberships, record.userId, "auth.email_verified", "User", record.userId);
    });
    return { message: "Email address verified." };
  }

  async signIn(emailInput: string, password: string, requestInfo: { ip?: string; userAgent?: string }): Promise<CreatedSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(emailInput) },
      include: { memberships: { include: { organization: { select: { name: true } } } } },
    });
    const passwordMatches = await argon2.verify(user?.passwordHash ?? await this.getDummyPasswordHash(), password).catch(() => false);
    if (!user || !passwordMatches || !user.emailVerifiedAt || !user.memberships.length) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const token = newOpaqueToken();
    const expiresAt = new Date(Date.now() + sessionTtlSeconds() * 1_000);
    const userAgentHash = requestInfo.userAgent ? hashFingerprint(requestInfo.userAgent) : null;
    const ipHash = requestInfo.ip ? hashFingerprint(requestInfo.ip) : null;
    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.authSession.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt, userAgentHash, ipHash },
      });
      await writeAuditForMemberships(tx, user.memberships, user.id, "auth.session_created", "AuthSession", created.id);
      return created;
    });
    return { token, expiresAt: session.expiresAt, user: toPublicUser(user) };
  }

  async authenticateSession(rawToken: string): Promise<{
    sessionId: string;
    user: PublicUser;
  } | null> {
    if (!rawToken || rawToken.length > 128) return null;
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: {
        user: {
          include: {
            memberships: { include: { organization: { select: { name: true } } } },
          },
        },
      },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.emailVerifiedAt) return null;
    return { sessionId: session.id, user: toPublicUser(session.user) };
  }

  async signOut(sessionId: string, userId: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const session = await tx.authSession.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: now },
      });
      if (!session.count) return;
      const memberships = await tx.membership.findMany({ where: { userId }, select: { organizationId: true } });
      await writeAuditForMemberships(tx, memberships, userId, "auth.session_revoked", "AuthSession", sessionId);
    });
  }

  async requestPasswordReset(emailInput: string): Promise<typeof GENERIC_EMAIL_RESPONSE> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(emailInput) },
      include: { memberships: true },
    });
    if (!user) return GENERIC_EMAIL_RESPONSE;
    const rawToken = newOpaqueToken();
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.authToken.updateMany({
        where: { userId: user.id, purpose: AuthTokenPurpose.PASSWORD_RESET, consumedAt: null },
        data: { consumedAt: now },
      });
      await insertAuthToken(tx, user.id, AuthTokenPurpose.PASSWORD_RESET, rawToken, new Date(now.getTime() + configuredTtl(
        "AUTH_PASSWORD_RESET_TTL_MINUTES", 60, 5, 1_440,
      ) * 60_000));
      await writeAuditForMemberships(tx, user.memberships, user.id, "auth.password_reset_requested", "User", user.id);
    });
    void this.deliver(() => this.mailer.sendPasswordReset(user.email, user.name, this.publicLink("reset-password", rawToken)));
    return GENERIC_EMAIL_RESPONSE;
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { memberships: true } } },
    });
    if (!record || record.purpose !== AuthTokenPurpose.PASSWORD_RESET || record.consumedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException(INVALID_TOKEN);
    }
    const passwordHash = await hashPassword(newPassword);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.authToken.updateMany({
        where: { id: record.id, purpose: AuthTokenPurpose.PASSWORD_RESET, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) throw new BadRequestException(INVALID_TOKEN);
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.authToken.updateMany({
        where: { userId: record.userId, purpose: AuthTokenPurpose.PASSWORD_RESET, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.authSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await writeAuditForMemberships(tx, record.user.memberships, record.userId, "auth.password_reset", "User", record.userId);
    });
    return { message: "Password reset successfully." };
  }

  async createOrganization(userId: string, input: CreateOrganizationInput): Promise<{ id: string; name: string; country: string | null }> {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: input.name, ...(input.country ? { country: input.country } : {}) },
      });
      await tx.membership.create({ data: { userId, organizationId: organization.id, role: MembershipRole.ORG_OWNER } });
      await tx.auditLog.create({
        data: auditRecord(organization.id, userId, "organization.created", "Organization", organization.id, { source: "owner" }),
      });
      return { id: organization.id, name: organization.name, country: organization.country };
    });
  }

  private async getDummyPasswordHash(): Promise<string> {
    return this.dummyPasswordHash ??= argon2.hash(randomBytes(32).toString("hex"), { type: argon2.argon2id });
  }

  private publicLink(path: string, rawToken: string): string {
    const production = process.env.NODE_ENV === "production";
    const configuredUrl = process.env.AUTH_PUBLIC_URL;
    if (production && !configuredUrl) throw new Error("AUTH_PUBLIC_URL must be configured in production.");
    const parsed = new URL(configuredUrl ?? "http://localhost:3000");
    if (
      !["http:", "https:"].includes(parsed.protocol)
      || parsed.username
      || parsed.password
      || parsed.search
      || parsed.hash
      || (production && parsed.protocol !== "https:")
    ) {
      throw new Error("AUTH_PUBLIC_URL must be an absolute web URL and use HTTPS in production.");
    }
    const baseUrl = parsed.toString().replace(/\/+$/, "");
    return `${baseUrl}/${path}?token=${encodeURIComponent(rawToken)}`;
  }

  private async deliver(send: () => Promise<void>): Promise<void> {
    try {
      await send();
    } catch {
      // Deliberately omit provider details, recipients, and token URLs from logs.
      this.logger.warn("Auth email delivery failed; use the generic resend flow if needed.");
    }
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashFingerprint(value: string): string {
  return createHmac("sha256", fingerprintKey).update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

function verificationExpiry(now: Date): Date {
  return new Date(now.getTime() + configuredTtl("AUTH_VERIFICATION_TTL_HOURS", 24, 1, 168) * 60 * 60_000);
}

function configuredTtl(name: string, fallback: number, minimum: number, maximum: number): number {
  const configured = Number(process.env[name] ?? fallback);
  return Number.isSafeInteger(configured) && configured >= minimum && configured <= maximum ? configured : fallback;
}

function sessionTtlSeconds(): number {
  const configured = Number(process.env.AUTH_SESSION_TTL_SECONDS ?? SESSION_COOKIE_TTL_SECONDS);
  return Number.isSafeInteger(configured) && configured >= 300 && configured <= 31_536_000 ? configured : SESSION_COOKIE_TTL_SECONDS;
}

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

async function insertAuthToken(
  tx: Prisma.TransactionClient,
  userId: string,
  purpose: AuthTokenPurpose,
  rawToken: string,
  expiresAt: Date,
): Promise<void> {
  await tx.authToken.create({ data: { userId, purpose, tokenHash: hashToken(rawToken), expiresAt } });
}

function toPublicUser(user: UserWithMemberships): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerifiedAt: user.emailVerifiedAt,
    memberships: user.memberships.map(({ organizationId, role, organization }) => ({
      organizationId,
      role,
      organizationName: organization.name,
    })),
  };
}

function auditRecord(
  organizationId: string,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Prisma.InputJsonObject = {},
): Prisma.AuditLogCreateManyInput {
  return { organizationId, actorType: "USER", actorId, action, targetType, targetId, metadata };
}

async function writeAuditForMemberships(
  tx: Prisma.TransactionClient,
  memberships: MembershipForAudit[],
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
): Promise<void> {
  if (!memberships.length) return;
  await tx.auditLog.createMany({
    data: [...new Set(memberships.map(({ organizationId }) => organizationId))]
      .map((organizationId) => auditRecord(organizationId, actorId, action, targetType, targetId)),
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
