import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
    window.localStorage.clear();
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

  it("zobrazí herní tabuli na /play/demo", () => {
    window.history.pushState({}, "", "/play/demo");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Herní tabule" })
    ).toBeInTheDocument();
    expect(screen.getByText("Kód hry: demo")).toBeInTheDocument();
    expect(
      screen.getByRole("grid", { name: "Herní tabule Hudební Riskuj" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "České hity za 100 bodů" })
    ).toBeInTheDocument();
  });

  it("po kliknutí označí políčko jako vybrané bez použití otázky", () => {
    window.history.pushState({}, "", "/play/demo");

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "České hity za 100 bodů" })
    );

    const activeTile = screen.getByRole("button", {
      name: "Vybráno: České hity za 100 bodů"
    });

    expect(activeTile).toHaveAttribute("data-state", "active");
    expect(activeTile).not.toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: "Použito: České hity za 100 bodů"
      })
    ).not.toBeInTheDocument();
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

  it("otevře vybranou otázku a odpověď nechá skrytou do odhalení", () => {
    window.history.pushState({}, "", "/play/demo");

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "České hity, otázka za 100 bodů"
      })
    );

    expect(
      screen.getByRole("heading", { name: "České hity za 100 bodů" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Který zpěvák proslavil píseň Jožin z bažin?")
    ).toBeInTheDocument();
    expect(screen.getByText("Ukázka českého hitu")).toBeInTheDocument();
    expect(screen.queryByText("Ivan Mládek")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zobrazit odpověď" }));

    expect(screen.getByText("Ivan Mládek")).toBeInTheDocument();
  });

  it("se vrátí na tabuli bez označení otázky jako použité", () => {
    window.history.pushState({}, "", "/play/demo");

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "České hity, otázka za 100 bodů"
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Zpět na tabuli" }));

    const tile = screen.getByRole("button", {
      name: "České hity, otázka za 100 bodů"
    });

    expect(tile).toBeEnabled();
    expect(tile).not.toHaveClass("board-tile-used");
  });
});
