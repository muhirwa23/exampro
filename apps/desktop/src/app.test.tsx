import { render, screen } from "@testing-library/react";
import { App } from "./app";

describe("App", () => {
  it("explains checks before asking for the exam code", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "TrustExam" })).toBeInTheDocument();
    expect(screen.getByText(/explain what is monitored and why/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter exam code" })).toBeInTheDocument();
  });
});
