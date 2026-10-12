import { describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("AppModule", () => {
  it("is defined as the API root module", () => {
    expect(AppModule).toBeDefined();
  });
});
