import { describe, expect, it } from "vitest";
import { t } from "./messages";

describe("workspace messages", () => {
  it("provides the product name", () => {
    expect(t("title")).toBe("TrustExam Pro");
  });
});
