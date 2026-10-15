import { describe, expect, it } from "vitest";
import { tenantFilterForModel } from "./scoped.js";

describe("tenantFilterForModel", () => {
  it("scopes directly tenant-owned rows by organizationId", () => {
    expect(tenantFilterForModel("Candidate", "org-a")).toEqual({ organizationId: "org-a" });
    expect(tenantFilterForModel("Exam", "org-b")).toEqual({ organizationId: "org-b" });
  });

  it("scopes organization records by their id and users through membership", () => {
    expect(tenantFilterForModel("Organization", "org-a")).toEqual({ id: "org-a" });
    expect(tenantFilterForModel("User", "org-a")).toEqual({ memberships: { some: { organizationId: "org-a" } } });
  });

  it("scopes child rows directly because every tenant-owned record carries organizationId", () => {
    expect(tenantFilterForModel("Answer", "org-a")).toEqual({ organizationId: "org-a" });
    expect(tenantFilterForModel("ExamRules", "org-b")).toEqual({ organizationId: "org-b" });
  });

  it("does not claim a tenant predicate for unrelated or unknown models", () => {
    expect(tenantFilterForModel("UnknownModel", "org-a")).toBeUndefined();
  });
});
