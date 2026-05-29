import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("zobrazí domovskou stránku s českými vstupy do hry", () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Hudební RISKuj!" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Editor hry" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Spustit hru" })
    ).toBeInTheDocument();
  });

  it("zobrazí placeholder editoru na /admin", () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Editor hry" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Zde vznikne administrační editor kol, kategorií a hudebních ukázek.")
    ).toBeInTheDocument();
  });

  it("zobrazí placeholder herního režimu s gameId na /play/demo", () => {
    window.history.pushState({}, "", "/play/demo");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Herní režim" })
    ).toBeInTheDocument();
    expect(screen.getByText("Kód hry: demo")).toBeInTheDocument();
  });

  it("naviguje z domovské stránky do editoru bez reloadu", () => {
    window.history.pushState({}, "", "/");

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Editor hry" }));

    expect(window.location.pathname).toBe("/admin");
    expect(
      screen.getByRole("heading", { name: "Editor hry" })
    ).toBeInTheDocument();
  });
});
