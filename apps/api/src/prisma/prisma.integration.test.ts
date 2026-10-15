import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { scoped } from "../tenancy/scoped.js";

const apiDirectory = fileURLToPath(new URL("../../", import.meta.url));
const databaseUrl = process.env.P1_TEST_DATABASE_URL;
const demoOrganizationId = "9fd1f65c-6044-4b33-8f2d-84dd3f54ce01";
let prisma: PrismaClient | undefined;

const integration = databaseUrl ? describe : describe.skip;
integration("Prisma migration, seed, and tenancy integration", () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("migrates and seeds a fresh local test database without leaking another organization's candidates", async () => {
    const target = new URL(databaseUrl!);
    const databaseName = decodeURIComponent(target.pathname.slice(1));
    if (!/(^|[_-])(test|p1)([_-]|$)/i.test(databaseName)) {
      throw new Error("P1_TEST_DATABASE_URL must name an isolated database containing 'test' or 'p1'");
    }
    if (!new Set(["localhost", "127.0.0.1", "::1"]).has(target.hostname)) {
      throw new Error("P1_TEST_DATABASE_URL must point to a local disposable PostgreSQL server");
    }

    const environment = {
      ...process.env,
      DATABASE_URL: databaseUrl!,
      DEMO_OWNER_PASSWORD: "p1-integration-owner-password",
      DEMO_OWNER_EMAIL: "integration-owner@example.invalid",
      DEMO_OWNER_NAME: "Integration Owner",
    };
    execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"], {
      cwd: apiDirectory,
      env: environment,
      stdio: "inherit",
    });
    execFileSync("pnpm", ["exec", "tsx", "src/prisma/seed.ts"], {
      cwd: apiDirectory,
      env: environment,
      stdio: "inherit",
    });

    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
    await prisma.$connect();
    const otherOrganizationId = "9fd1f65c-6044-4b33-8f2d-84dd3f54ce90";
    await prisma.organization.upsert({
      where: { id: otherOrganizationId },
      update: { name: "Isolation Test Organization", country: "RW", dataRegion: "AFRICA" },
      create: { id: otherOrganizationId, name: "Isolation Test Organization", country: "RW", dataRegion: "AFRICA" },
    });
    await prisma.candidate.upsert({
      where: {
        organizationId_email: {
          organizationId: otherOrganizationId,
          email: "other-tenant@example.invalid",
        },
      },
      update: { name: "Other Tenant Candidate" },
      create: {
        id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce91",
        organizationId: otherOrganizationId,
        name: "Other Tenant Candidate",
        email: "other-tenant@example.invalid",
      },
    });

    const tenantClient = scoped(prisma, demoOrganizationId);
    const visibleCandidates = await tenantClient.candidate.findMany({ orderBy: { email: "asc" } });
    expect(visibleCandidates).toHaveLength(3);
    expect(visibleCandidates.map(({ email }) => email)).not.toContain("other-tenant@example.invalid");

    const demoInvitation = await prisma.invitation.findFirstOrThrow({
      where: { organizationId: demoOrganizationId },
      select: { id: true },
    });
    const attempt = await prisma.attempt.create({
      data: { organizationId: demoOrganizationId, invitationId: demoInvitation.id },
    });
    await expect(
      prisma.riskAssessment.create({
        data: {
          organizationId: demoOrganizationId,
          attemptId: attempt.id,
          score: 101,
          band: "HIGH",
          version: 1,
        },
      }),
    ).rejects.toThrow();
  });
});
