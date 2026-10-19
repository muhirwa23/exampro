import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { AuthTokenPurpose, MembershipRole, PrismaClient } from "../generated/prisma/client.js";
import { AuthService, hashToken } from "./auth.service.js";
import type { AuthMailer } from "./auth.types.js";
import { signUpSchema } from "./auth.validation.js";

const apiDirectory = fileURLToPath(new URL("../../", import.meta.url));
const prismaExecutable = fileURLToPath(new URL("../../node_modules/.bin/prisma", import.meta.url));
const databaseUrl = process.env.P1_TEST_DATABASE_URL;
let prisma: PrismaClient | undefined;

const integration = databaseUrl ? describe : describe.skip;
integration("authentication lifecycle integration", () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("creates an owner/org, verifies one-time email, manages hashed sessions, resets passwords, and audits org creation", async () => {
    const target = new URL(databaseUrl!);
    const databaseName = decodeURIComponent(target.pathname.slice(1));
    if (!/(^|[_-])(test|p1)([_-]|$)/i.test(databaseName)) {
      throw new Error("P1_TEST_DATABASE_URL must name an isolated database containing 'test' or 'p1'");
    }
    if (!new Set(["localhost", "127.0.0.1", "::1"]).has(target.hostname)) {
      throw new Error("P1_TEST_DATABASE_URL must point to a local disposable PostgreSQL server");
    }

    const environment = { ...process.env, DATABASE_URL: databaseUrl! };
    execFileSync(prismaExecutable, ["migrate", "deploy", "--config", "prisma.config.ts"], {
      cwd: apiDirectory,
      env: environment,
      stdio: "inherit",
    });
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
    await prisma.$connect();

    const messages: Array<{ kind: "verification" | "reset"; to: string; url: string }> = [];
    const mailer: AuthMailer = {
      async sendVerification(to, _name, url) { messages.push({ kind: "verification", to, url }); },
      async sendPasswordReset(to, _name, url) { messages.push({ kind: "reset", to, url }); },
    };
    const service = new AuthService(prisma as never, mailer);
    const suffix = crypto.randomUUID();
    const email = `auth-${suffix}@example.invalid`;
    const input = signUpSchema.parse({
      email: `  ${email.toUpperCase()}  `,
      name: "Auth Integration Owner",
      password: "first-owner-password-2026",
      organizationName: `Auth Integration Org ${suffix}`,
      country: "rw",
    });
    const ownedOrganizationIds: string[] = [];

    try {
      expect(await service.signUp(input)).toEqual({ message: "If the account is eligible, an email will be sent shortly." });
      const created = await prisma.user.findUniqueOrThrow({
        where: { email },
        include: { memberships: { include: { organization: true } } },
      });
      const firstOrganization = created.memberships[0]?.organization;
      expect(firstOrganization?.name).toBe(`Auth Integration Org ${suffix}`);
      expect(firstOrganization?.country).toBe("RW");
      expect(created.emailVerifiedAt).toBeNull();
      await expect(service.signIn(email, input.password, {})).rejects.toThrow("Email, password, or verification status is invalid");
      expect(created.memberships[0]?.role).toBe(MembershipRole.ORG_OWNER);
      ownedOrganizationIds.push(firstOrganization!.id);

      const genericResponse = await service.signUp(input);
      expect(genericResponse).toEqual({ message: "If the account is eligible, an email will be sent shortly." });
      expect(await prisma.organization.count({ where: { name: `Auth Integration Org ${suffix}` } })).toBe(1);

      const initialVerification = extractToken(messages.at(-1)!.url);
      const initialTokenRecord = await prisma.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(initialVerification) } });
      expect(initialTokenRecord.purpose).toBe(AuthTokenPurpose.EMAIL_VERIFICATION);
      expect(initialTokenRecord.tokenHash).not.toBe(initialVerification);
      expect(initialTokenRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());

      await service.resendVerification(email);
      const replacementVerification = extractToken(messages.at(-1)!.url);
      await expect(service.verifyEmail(initialVerification)).rejects.toThrow("invalid or has expired");
      await service.verifyEmail(replacementVerification);
      const verified = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
      expect(verified.emailVerifiedAt).toBeInstanceOf(Date);
      expect(await prisma.authToken.count({
        where: { userId: created.id, purpose: AuthTokenPurpose.EMAIL_VERIFICATION, consumedAt: null },
      })).toBe(0);

      const firstSession = await service.signIn(email, input.password, { ip: "127.0.0.1", userAgent: "test-agent" });
      expect(firstSession.user.email).toBe(email);
      expect("passwordHash" in firstSession.user).toBe(false);
      const storedSession = await prisma.authSession.findUniqueOrThrow({ where: { tokenHash: hashToken(firstSession.token) } });
      expect(storedSession.tokenHash).not.toBe(firstSession.token);
      expect(storedSession.ipHash).not.toBe("127.0.0.1");
      expect(await service.authenticateSession(firstSession.token)).not.toBeNull();

      const secondOrganization = await service.createOrganization(created.id, { name: "Additional Org", country: "KE" });
      ownedOrganizationIds.push(secondOrganization.id);
      expect(await prisma.membership.findUniqueOrThrow({
        where: { userId_organizationId: { userId: created.id, organizationId: secondOrganization.id } },
      })).toMatchObject({ role: MembershipRole.ORG_OWNER });

      await service.requestPasswordReset(email);
      const resetToken = extractToken(messages.at(-1)!.url);
      const resetRecord = await prisma.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(resetToken) } });
      expect(resetRecord.purpose).toBe(AuthTokenPurpose.PASSWORD_RESET);
      expect(resetRecord.tokenHash).not.toBe(resetToken);
      await service.resetPassword(resetToken, "second-owner-password-2026");
      await expect(service.resetPassword(resetToken, "third-owner-password-2026")).rejects.toThrow("invalid or has expired");
      expect(await service.authenticateSession(firstSession.token)).toBeNull();
      await expect(service.signIn(email, input.password, {})).rejects.toThrow("Email, password, or verification status is invalid");
      const replacementSession = await service.signIn(email, "second-owner-password-2026", {});
      expect(replacementSession.user.email).toBe(email);
      const replacementSessionRecord = await prisma.authSession.findUniqueOrThrow({
        where: { tokenHash: hashToken(replacementSession.token) },
      });
      await service.signOut(replacementSessionRecord.id, created.id);
      expect(await service.authenticateSession(replacementSession.token)).toBeNull();

      const createAudit = await prisma.auditLog.findFirst({
        where: { organizationId: secondOrganization.id, action: "organization.created", targetId: secondOrganization.id },
      });
      expect(createAudit).not.toBeNull();
    } finally {
      await prisma.authSession.deleteMany({ where: { user: { email } } });
      await prisma.authToken.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
      await prisma.organization.deleteMany({ where: { id: { in: ownedOrganizationIds } } });
    }
  });

  it("rejects expired email-verification tokens", async () => {
    const messages: Array<{ kind: "verification" | "reset"; to: string; url: string }> = [];
    const mailer: AuthMailer = {
      async sendVerification(to, _name, url) { messages.push({ kind: "verification", to, url }); },
      async sendPasswordReset(to, _name, url) { messages.push({ kind: "reset", to, url }); },
    };
    const service = new AuthService(prisma as never, mailer);
    const suffix = crypto.randomUUID();
    const email = `expired-${suffix}@example.invalid`;
    const organizationIds: string[] = [];
    try {
      await service.signUp(signUpSchema.parse({
        email,
        name: "Expired Token Owner",
        password: "expired-owner-password-2026",
        organizationName: `Expired Org ${suffix}`,
      }));
      const token = extractToken(messages[0]!.url);
      const record = await prisma!.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(token) } });
      await prisma!.authToken.update({ where: { id: record.id }, data: { expiresAt: new Date(Date.now() - 1_000) } });
      await expect(service.verifyEmail(token)).rejects.toThrow("invalid or has expired");
      const memberships = await prisma!.membership.findMany({ where: { user: { email } }, select: { organizationId: true } });
      organizationIds.push(...memberships.map(({ organizationId }) => organizationId));
    } finally {
      await prisma!.user.deleteMany({ where: { email } });
      await prisma!.organization.deleteMany({ where: { id: { in: organizationIds } } });
    }
  });
});

function extractToken(url: string): string {
  const token = new URL(url).searchParams.get("token");
  if (!token) throw new Error("Test mail did not contain an auth token");
  return token;
}
