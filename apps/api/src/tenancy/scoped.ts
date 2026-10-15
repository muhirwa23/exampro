import { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "../generated/prisma/client.js";

type Filter = Record<string, unknown>;

const directTenantModels = new Set([
  "Membership",
  "Exam",
  "Question",
  "Candidate",
  "Invitation",
  "SystemCheck",
  "Attempt",
  "Answer",
  "IntegrityEvent",
  "Evidence",
  "IdentityCheck",
  "RiskAssessment",
  "ReviewDecision",
  "Appeal",
  "Consent",
  "AuditLog",
  "ExamRules",
]);

const relationTenantFilters: Record<string, (organizationId: string) => Filter> = {
  Organization: (organizationId) => ({ id: organizationId }),
  User: (organizationId) => ({ memberships: { some: { organizationId } } }),
};

export function tenantFilterForModel(model: string, organizationId: string): Filter | undefined {
  if (directTenantModels.has(model)) return { organizationId };
  return relationTenantFilters[model]?.(organizationId);
}

function tenantCreateField(model: string): "organizationId" | "id" | undefined {
  if (directTenantModels.has(model)) return "organizationId";
  if (model === "Organization") return "id";
  return undefined;
}

function attachTenantToCreate(model: string, data: unknown, organizationId: string): unknown {
  const field = tenantCreateField(model);
  if (!field) return data;
  const rows = Array.isArray(data) ? data : [data];
  const scopedRows = rows.map((row) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new TypeError(`Invalid ${model} create payload`);
    }
    const value = row as Record<string, unknown>;
    if (value[field] !== undefined && value[field] !== organizationId) {
      throw new Error(`Cross-organization ${model} write rejected`);
    }
    return { ...value, [field]: organizationId };
  });
  return Array.isArray(data) ? scopedRows : scopedRows[0];
}

function assertTenantWrite(model: string, data: unknown, organizationId: string): void {
  if (!directTenantModels.has(model) || typeof data !== "object" || data === null || Array.isArray(data)) return;
  const value = data as Record<string, unknown>;
  if (value.organizationId !== undefined && value.organizationId !== organizationId) {
    throw new Error(`Cross-organization ${model} write rejected`);
  }
}

/**
 * Return a client whose model operations are constrained to one organization.
 * Keep raw SQL and nested writes out of tenant-facing code; composite tenant
 * foreign keys provide a second guard against cross-organization relations.
 */
export function scoped(client: PrismaClient, organizationId: string) {
  if (!organizationId.trim()) throw new TypeError("organizationId is required for scoped queries");

  return client.$extends(
    Prisma.defineExtension({
      name: "organization-scope",
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const filter = tenantFilterForModel(model, organizationId);
            if (!filter) return query(args);

            const mutableArgs = args as unknown as Record<string, unknown>;
            if (operation === "create" || operation === "createMany" || operation === "createManyAndReturn") {
              return query({
                ...mutableArgs,
                data: attachTenantToCreate(model, mutableArgs.data, organizationId),
              } as never);
            }

            if (operation === "upsert") {
              const create = attachTenantToCreate(model, mutableArgs.create, organizationId);
              assertTenantWrite(model, mutableArgs.update, organizationId);
              return query({
                ...mutableArgs,
                where: {
                  ...(mutableArgs.where as Filter),
                  AND: [filter],
                },
                create,
              } as never);
            }

            assertTenantWrite(model, mutableArgs.data, organizationId);
            const existingWhere = (mutableArgs.where ?? {}) as Filter;
            const existingAnd = Array.isArray(existingWhere.AND) ? existingWhere.AND : [];
            return query({
              ...mutableArgs,
              where: {
                ...existingWhere,
                AND: [...existingAnd, filter],
              },
            } as never);
          },
        },
      },
    }),
  );
}
