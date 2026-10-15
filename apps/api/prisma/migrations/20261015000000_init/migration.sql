-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('ORG_OWNER', 'ADMIN', 'REVIEWER', 'SENIOR_REVIEWER');

-- CreateEnum
CREATE TYPE "SecurityLevel" AS ENUM ('STANDARD', 'LOCKDOWN');

-- CreateEnum
CREATE TYPE "IdCheck" AS ENUM ('NONE', 'VENDOR', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'MULTI', 'TRUE_FALSE', 'SHORT', 'ESSAY', 'FILE');

-- CreateEnum
CREATE TYPE "InvitationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('SENT', 'OPENED', 'SYSTEM_CHECK_PASSED', 'STARTED', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttemptState" AS ENUM ('IN_PROGRESS', 'DISCONNECTED', 'SUBMITTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "IntegritySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('SNAPSHOT_CAMERA', 'SNAPSHOT_SCREEN', 'CLIP_AUDIO', 'CLIP_VIDEO', 'ID_DOC', 'SELFIE');

-- CreateEnum
CREATE TYPE "IdentityMethod" AS ENUM ('VENDOR', 'MANUAL');

-- CreateEnum
CREATE TYPE "IdentityResult" AS ENUM ('PASS', 'FAIL', 'REVIEW');

-- CreateEnum
CREATE TYPE "RiskBand" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReviewDecisionType" AS ENUM ('ACCEPT', 'RETAKE', 'REJECT', 'ESCALATE');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'UPHELD', 'DENIED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "dataRegion" TEXT NOT NULL DEFAULT 'AFRICA',
    "retentionMediaDays" INTEGER NOT NULL DEFAULT 30,
    "retentionReportDays" INTEGER NOT NULL DEFAULT 365,
    "faceMatchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("userId","organizationId")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL DEFAULT '',
    "durationSec" INTEGER NOT NULL,
    "passMarkPct" DOUBLE PRECISION NOT NULL,
    "windowStart" TIMESTAMPTZ(3),
    "windowEnd" TIMESTAMPTZ(3),
    "securityLevel" "SecurityLevel" NOT NULL DEFAULT 'STANDARD',
    "idCheck" "IdCheck" NOT NULL DEFAULT 'NONE',
    "cameraRequired" BOOLEAN NOT NULL DEFAULT false,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "prompt" JSONB NOT NULL,
    "options" JSONB,
    "correct" JSONB,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "poolTag" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "externalRef" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "examCodeHash" TEXT NOT NULL,
    "channel" "InvitationChannel" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'SENT',
    "accommodations" JSONB NOT NULL DEFAULT '{}',
    "sentAt" TIMESTAMPTZ(3),
    "openedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemCheck" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "os" TEXT NOT NULL,
    "osVersion" TEXT NOT NULL,
    "cpuArch" TEXT NOT NULL,
    "cameraOk" BOOLEAN NOT NULL,
    "micOk" BOOLEAN NOT NULL,
    "bandwidthKbps" INTEGER NOT NULL,
    "blockingApps" JSONB NOT NULL DEFAULT '[]',
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "deviceKeyFingerprint" TEXT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMPTZ(3),
    "lastHeartbeatAt" TIMESTAMPTZ(3),
    "state" "AttemptState" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION,
    "scorePct" DOUBLE PRECISION,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "value" JSONB,
    "clientSavedAt" TIMESTAMPTZ(3),
    "serverSavedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrityEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "IntegritySeverity" NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB NOT NULL DEFAULT '{}',
    "evidenceIds" UUID[] DEFAULT ARRAY[]::UUID[],

    CONSTRAINT "IntegrityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleteAfter" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityCheck" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "method" "IdentityMethod" NOT NULL,
    "vendorRef" TEXT,
    "result" "IdentityResult" NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "band" "RiskBand" NOT NULL,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RiskAssessment_score_range" CHECK ("score" BETWEEN 0 AND 100)
);

-- CreateTable
CREATE TABLE "ReviewDecision" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "ReviewDecisionType" NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "evidenceViewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "decidedBy" UUID,
    "decidedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "noticeVersion" TEXT NOT NULL,
    "biometricConsent" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRules" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "json" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamRules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "Organization"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Membership_organizationId_role_idx" ON "Membership"("organizationId", "role");

-- CreateIndex
CREATE INDEX "Exam_organizationId_status_createdAt_idx" ON "Exam"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Exam_organizationId_windowStart_windowEnd_idx" ON "Exam"("organizationId", "windowStart", "windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_id_organizationId_key" ON "Exam"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Question_organizationId_examId_order_idx" ON "Question"("organizationId", "examId", "order");

-- CreateIndex
CREATE INDEX "Question_organizationId_examId_poolTag_idx" ON "Question"("organizationId", "examId", "poolTag");

-- CreateIndex
CREATE INDEX "Question_examId_organizationId_idx" ON "Question"("examId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_id_organizationId_key" ON "Question"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Candidate_organizationId_createdAt_idx" ON "Candidate"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Candidate_organizationId_externalRef_idx" ON "Candidate"("organizationId", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_id_organizationId_key" ON "Candidate"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_organizationId_email_key" ON "Candidate"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_examCodeHash_key" ON "Invitation"("examCodeHash");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_examId_status_idx" ON "Invitation"("organizationId", "examId", "status");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_candidateId_createdAt_idx" ON "Invitation"("organizationId", "candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_sentAt_idx" ON "Invitation"("organizationId", "sentAt");

-- CreateIndex
CREATE INDEX "Invitation_examId_organizationId_idx" ON "Invitation"("examId", "organizationId");

-- CreateIndex
CREATE INDEX "Invitation_candidateId_organizationId_idx" ON "Invitation"("candidateId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_id_organizationId_key" ON "Invitation"("id", "organizationId");

-- CreateIndex
CREATE INDEX "SystemCheck_organizationId_invitationId_createdAt_idx" ON "SystemCheck"("organizationId", "invitationId", "createdAt");

-- CreateIndex
CREATE INDEX "SystemCheck_organizationId_passed_createdAt_idx" ON "SystemCheck"("organizationId", "passed", "createdAt");

-- CreateIndex
CREATE INDEX "SystemCheck_invitationId_organizationId_idx" ON "SystemCheck"("invitationId", "organizationId");

-- CreateIndex
CREATE INDEX "Attempt_organizationId_invitationId_startedAt_idx" ON "Attempt"("organizationId", "invitationId", "startedAt");

-- CreateIndex
CREATE INDEX "Attempt_organizationId_state_lastHeartbeatAt_idx" ON "Attempt"("organizationId", "state", "lastHeartbeatAt");

-- CreateIndex
CREATE INDEX "Attempt_invitationId_organizationId_idx" ON "Attempt"("invitationId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_id_organizationId_key" ON "Attempt"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Answer_organizationId_attemptId_serverSavedAt_idx" ON "Answer"("organizationId", "attemptId", "serverSavedAt");

-- CreateIndex
CREATE INDEX "Answer_attemptId_organizationId_idx" ON "Answer"("attemptId", "organizationId");

-- CreateIndex
CREATE INDEX "Answer_questionId_organizationId_idx" ON "Answer"("questionId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "IntegrityEvent_organizationId_attemptId_occurredAt_idx" ON "IntegrityEvent"("organizationId", "attemptId", "occurredAt");

-- CreateIndex
CREATE INDEX "IntegrityEvent_organizationId_severity_occurredAt_idx" ON "IntegrityEvent"("organizationId", "severity", "occurredAt");

-- CreateIndex
CREATE INDEX "IntegrityEvent_attemptId_organizationId_idx" ON "IntegrityEvent"("attemptId", "organizationId");

-- CreateIndex
CREATE INDEX "Evidence_organizationId_attemptId_createdAt_idx" ON "Evidence"("organizationId", "attemptId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_organizationId_deleteAfter_idx" ON "Evidence"("organizationId", "deleteAfter");

-- CreateIndex
CREATE INDEX "Evidence_attemptId_organizationId_idx" ON "Evidence"("attemptId", "organizationId");

-- CreateIndex
CREATE INDEX "IdentityCheck_organizationId_attemptId_createdAt_idx" ON "IdentityCheck"("organizationId", "attemptId", "createdAt");

-- CreateIndex
CREATE INDEX "IdentityCheck_attemptId_organizationId_idx" ON "IdentityCheck"("attemptId", "organizationId");

-- CreateIndex
CREATE INDEX "RiskAssessment_organizationId_band_createdAt_idx" ON "RiskAssessment"("organizationId", "band", "createdAt");

-- CreateIndex
CREATE INDEX "RiskAssessment_attemptId_organizationId_idx" ON "RiskAssessment"("attemptId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_attemptId_version_key" ON "RiskAssessment"("attemptId", "version");

-- CreateIndex
CREATE INDEX "ReviewDecision_organizationId_attemptId_createdAt_idx" ON "ReviewDecision"("organizationId", "attemptId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewDecision_organizationId_reviewerId_createdAt_idx" ON "ReviewDecision"("organizationId", "reviewerId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewDecision_attemptId_organizationId_idx" ON "ReviewDecision"("attemptId", "organizationId");

-- CreateIndex
CREATE INDEX "ReviewDecision_reviewerId_idx" ON "ReviewDecision"("reviewerId");

-- CreateIndex
CREATE INDEX "Appeal_organizationId_attemptId_createdAt_idx" ON "Appeal"("organizationId", "attemptId", "createdAt");

-- CreateIndex
CREATE INDEX "Appeal_organizationId_status_createdAt_idx" ON "Appeal"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Appeal_attemptId_organizationId_idx" ON "Appeal"("attemptId", "organizationId");

-- CreateIndex
CREATE INDEX "Appeal_decidedBy_idx" ON "Appeal"("decidedBy");

-- CreateIndex
CREATE INDEX "Consent_organizationId_attemptId_acceptedAt_idx" ON "Consent"("organizationId", "attemptId", "acceptedAt");

-- CreateIndex
CREATE INDEX "Consent_attemptId_organizationId_idx" ON "Consent"("attemptId", "organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_targetType_targetId_idx" ON "AuditLog"("organizationId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_actorId_createdAt_idx" ON "AuditLog"("organizationId", "actorId", "createdAt");

-- CreateIndex
CREATE INDEX "ExamRules_organizationId_examId_version_idx" ON "ExamRules"("organizationId", "examId", "version");

-- CreateIndex
CREATE INDEX "ExamRules_examId_organizationId_idx" ON "ExamRules"("examId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRules_examId_version_key" ON "ExamRules"("examId", "version");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_organizationId_fkey" FOREIGN KEY ("examId", "organizationId") REFERENCES "Exam"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_examId_organizationId_fkey" FOREIGN KEY ("examId", "organizationId") REFERENCES "Exam"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_candidateId_organizationId_fkey" FOREIGN KEY ("candidateId", "organizationId") REFERENCES "Candidate"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemCheck" ADD CONSTRAINT "SystemCheck_invitationId_organizationId_fkey" FOREIGN KEY ("invitationId", "organizationId") REFERENCES "Invitation"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_invitationId_organizationId_fkey" FOREIGN KEY ("invitationId", "organizationId") REFERENCES "Invitation"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_organizationId_fkey" FOREIGN KEY ("questionId", "organizationId") REFERENCES "Question"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityEvent" ADD CONSTRAINT "IntegrityEvent_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityCheck" ADD CONSTRAINT "IdentityCheck_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_attemptId_organizationId_fkey" FOREIGN KEY ("attemptId", "organizationId") REFERENCES "Attempt"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRules" ADD CONSTRAINT "ExamRules_examId_organizationId_fkey" FOREIGN KEY ("examId", "organizationId") REFERENCES "Exam"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
