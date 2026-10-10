import { render, screen } from "@testing-library/react";
import { Welcome } from "./welcome";

describe("Welcome", () => {
  it("shows the product name and a sign in button", () => {
    render(<Welcome />);
    expect(screen.getByRole("heading", { name: "TrustExam Pro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
