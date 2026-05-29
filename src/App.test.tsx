import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("zobrazí český titulek hudebního kvízu", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Riskuj — hudební kvíz" })
    ).toBeInTheDocument();
  });
});
