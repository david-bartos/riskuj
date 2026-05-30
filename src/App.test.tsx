import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("zobrazí český titulek hudebního kvízu", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Riskuj — hudební kvíz" })
    ).toBeInTheDocument();
  });

  it("zobrazí demo herní tabuli na /play/demo", () => {
    window.history.pushState({}, "", "/play/demo");

    render(<App />);

    expect(
      screen.getByRole("grid", { name: "Herní tabule Hudební Riskuj demo" })
    ).toBeInTheDocument();
    expect(screen.getByText("České hity")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /za 100 bodů/ })).toHaveLength(
      5
    );
  });

  it("kliknutí na dostupné políčko ho označí jako aktivní, ale nepoužité", () => {
    window.history.pushState({}, "", "/play/demo");

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "České hity za 100 bodů" })
    );

    const selectedTile = screen.getByRole("button", {
      name: "Vybráno: České hity za 100 bodů"
    });

    expect(selectedTile).toHaveAttribute("data-state", "active");
    expect(selectedTile).not.toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: "Použito: České hity za 100 bodů"
      })
    ).not.toBeInTheDocument();
  });
});
