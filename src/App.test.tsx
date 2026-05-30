import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { demoGame } from "./data/demoGame";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === "/api/games") {
          return Response.json([
            {
              id: demoGame.id,
              title: demoGame.title,
              updatedAt: demoGame.updatedAt,
              roundCount: demoGame.rounds.length
            }
          ]);
        }

        if (url === `/api/games/${demoGame.id}` && !init) {
          return Response.json(demoGame);
        }

        if (url === "/api/audio-assets") {
          return Response.json([]);
        }

        return new Response("not found", { status: 404 });
      })
    );
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("zobrazí domovskou stránku s českými vstupy do hry", () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Hudební RISKuj!" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editor hry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spustit hru" })).toBeInTheDocument();
  });

  it("zobrazí editor hry na /admin", async () => {
    window.history.pushState({}, "", "/admin");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === "/api/games") {
          return Response.json([]);
        }

        if (url === "/api/audio-assets") {
          return Response.json([]);
        }

        return new Response("not found", { status: 404 });
      })
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Editor hry" })).toBeInTheDocument();
    expect(screen.getByText("Upravte otázky, poslechové ukázky a třetí kolo.")).toBeInTheDocument();
    expect(await screen.findByLabelText("Editor hry")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Uložit hru" })).toBeInTheDocument();
  });

  it("zobrazí herní tabuli na /play/riskuj-2026-06-06", async () => {
    window.history.pushState({}, "", "/play/riskuj-2026-06-06");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Riskuj!" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Skóre týmů" })).toBeInTheDocument();
  });

  it("naviguje z domovské stránky přímo do seed hry Riskuj 6.6", () => {
    window.history.pushState({}, "", "/");

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Spustit hru" }));

    expect(window.location.pathname).toBe("/play/riskuj-2026-06-06");
  });

  it("naviguje z domovské stránky do editoru bez reloadu", () => {
    window.history.pushState({}, "", "/");

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Editor hry" }));

    expect(window.location.pathname).toBe("/admin");
    expect(screen.getByRole("heading", { name: "Editor hry" })).toBeInTheDocument();
  });
});
