import { describe, expect, it } from "vitest";
import { getRuntimeInfo } from "./native";

describe("desktop runtime wrapper", () => {
  it("provides the product name and a runtime mode", () => {
    const info = getRuntimeInfo();
    expect(info.productName).toBe("TrustExam Pro");
    expect(typeof info.isDesktop).toBe("boolean");
  });
});
