import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";

const organizationId = "9fd1f65c-6044-4b33-8f2d-84dd3f54ce01";
const ownerId = "9fd1f65c-6044-4b33-8f2d-84dd3f54ce02";
const examId = "9fd1f65c-6044-4b33-8f2d-84dd3f54ce03";

const candidates = [
  { id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce11", name: "Aline Demo", email: "aline.candidate@example.invalid", code: "TRUST001" },
  { id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce12", name: "Eric Demo", email: "eric.candidate@example.invalid", code: "TRUST002" },
  { id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce13", name: "Grace Demo", email: "grace.candidate@example.invalid", code: "TRUST003" },
] as const;

const questions = [
  {
    id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce21",
    type: "MCQ" as const,
    prompt: { text: "Which value is a prime number?" },
    options: ["9", "11", "15", "21"],
    correct: "11",
    points: 1,
  },
  {
    id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce22",
    type: "MULTI" as const,
    prompt: { text: "Select the two even numbers." },
    options: ["2", "3", "8", "9"],
    correct: ["2", "8"],
    points: 2,
  },
  {
    id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce23",
    type: "TRUE_FALSE" as const,
    prompt: { text: "Water freezes at 0°C at standard pressure." },
    options: ["True", "False"],
    correct: true,
    points: 1,
  },
  {
    id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce24",
    type: "SHORT" as const,
    prompt: { text: "What is the capital city of Rwanda?" },
    options: null,
    correct: "Kigali",
    points: 1,
  },
  {
    id: "9fd1f65c-6044-4b33-8f2d-84dd3f54ce25",
    type: "ESSAY" as const,
    prompt: { text: "Describe one way to make a public service more accessible." },
    options: null,
    correct: null,
    points: 5,
  },
] as const;

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  const ownerPassword = process.env.DEMO_OWNER_PASSWORD;
  if (!connectionString) throw new Error("DATABASE_URL is required to run the demo seed");
  if (!ownerPassword || ownerPassword.length < 12) {
    throw new Error("DEMO_OWNER_PASSWORD must be set to at least 12 characters");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const ownerEmail = (process.env.DEMO_OWNER_EMAIL ?? "owner@example.invalid").trim().toLowerCase();
  const ownerName = process.env.DEMO_OWNER_NAME ?? "Demo Organization Owner";

  try {
    const passwordHash = await argon2.hash(ownerPassword, { type: argon2.argon2id });
    await prisma.$transaction(async (tx) => {
      await tx.organization.upsert({
        where: { id: organizationId },
        update: { name: "TrustExam Demo Organization", country: "RW", dataRegion: "AFRICA" },
        create: {
          id: organizationId,
          name: "TrustExam Demo Organization",
          country: "RW",
          dataRegion: "AFRICA",
        },
      });

      await tx.user.upsert({
        where: { email: ownerEmail },
        update: { name: ownerName, passwordHash, emailVerifiedAt: new Date() },
        create: { id: ownerId, email: ownerEmail, name: ownerName, passwordHash, emailVerifiedAt: new Date() },
      });

      const owner = await tx.user.findUniqueOrThrow({ where: { email: ownerEmail }, select: { id: true } });
      await tx.membership.upsert({
        where: { userId_organizationId: { userId: owner.id, organizationId } },
        update: { role: "ORG_OWNER" },
        create: { userId: owner.id, organizationId, role: "ORG_OWNER" },
      });

      await tx.exam.upsert({
        where: { id: examId },
        update: {
          title: "TrustExam Demo Assessment",
          instructions: "Answer each question independently. This is sample content.",
          durationSec: 1800,
          passMarkPct: 60,
          status: "PUBLISHED",
        },
        create: {
          id: examId,
          organizationId,
          title: "TrustExam Demo Assessment",
          instructions: "Answer each question independently. This is sample content.",
          durationSec: 1800,
          passMarkPct: 60,
          status: "PUBLISHED",
          securityLevel: "STANDARD",
          idCheck: "MANUAL",
          cameraRequired: false,
        },
      });

      for (const [index, question] of questions.entries()) {
        const questionData = {
          organizationId,
          examId,
          type: question.type,
          prompt: question.prompt as Prisma.InputJsonValue,
          options: question.options === null ? Prisma.DbNull : (question.options as Prisma.InputJsonValue),
          correct: question.correct === null ? Prisma.DbNull : (question.correct as Prisma.InputJsonValue),
          points: question.points,
          order: index + 1,
          poolTag: "demo",
        };
        await tx.question.upsert({
          where: { id: question.id },
          update: questionData,
          create: { id: question.id, ...questionData },
        });
      }

      for (const [index, candidate] of candidates.entries()) {
        await tx.candidate.upsert({
          where: { organizationId_email: { organizationId, email: candidate.email } },
          update: { name: candidate.name, externalRef: `DEMO-${index + 1}` },
          create: {
            id: candidate.id,
            organizationId,
            name: candidate.name,
            email: candidate.email,
            externalRef: `DEMO-${index + 1}`,
          },
        });

        const candidateRecord = await tx.candidate.findUniqueOrThrow({
          where: { organizationId_email: { organizationId, email: candidate.email } },
          select: { id: true },
        });
        const examCodeHash = await argon2.hash(candidate.code, { type: argon2.argon2id });
        await tx.invitation.upsert({
          where: { id: `9fd1f65c-6044-4b33-8f2d-84dd3f54ce3${index + 1}` },
          update: { examCodeHash, status: "SENT", channel: "EMAIL" },
          create: {
            id: `9fd1f65c-6044-4b33-8f2d-84dd3f54ce3${index + 1}`,
            organizationId,
            examId,
            candidateId: candidateRecord.id,
            examCodeHash,
            channel: "EMAIL",
            status: "SENT",
            sentAt: new Date(),
          },
        });
      }
    });

    console.info("Demo seed complete: TrustExam Demo Organization, owner, published exam, 5 questions, 3 candidates, and 3 invitations.");
    for (const [index, candidate] of candidates.entries()) {
      console.info(`Demo invitation code ${index + 1}: ${candidate.code}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error("Demo seed failed", error);
  process.exitCode = 1;
});
