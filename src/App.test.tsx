import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("zobrazí český titulek hudebního kvízu", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Riskuj — hudební kvíz" })
    ).toBeInTheDocument();
  });

  it("na admin route zobrazí editor hry", async () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Editor hry" })).toBeInTheDocument();
    expect(screen.getByLabelText("Editor hry")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Uložit hru" })).toBeInTheDocument();
    expect(
      screen.getByText("Upravte otázky, poslechové ukázky a třetí kolo.")
    ).toBeInTheDocument();
  });
});
