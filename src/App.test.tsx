import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("na / rovnou zobrazí admin bez domovské stránky a globální navigace", async () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(await screen.findByLabelText("Editor hry")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Editor hry" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Hudební RISKuj!" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Hlavní navigace" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("navigation", { name: "Hlavní navigace" })).not.toBeInTheDocument();
  });

  it("doplní tooltipy pro interaktivní prvky", async () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    const gameSelect = await screen.findByLabelText("Načíst existující hru");
    const newGameButton = screen.getByRole("button", { name: "Nová hra" });
    const settingsTab = screen.getByRole("tab", { name: "Nastavení" });

    await waitFor(() => {
      expect(gameSelect).toHaveAttribute(
        "title",
        "Výběrem změníte hodnotu pole „Načíst existující hru“. Změna se projeví v aktuálně otevřené hře nebo editoru."
      );
      expect(newGameButton).toHaveAttribute(
        "title",
        "Kliknutím založíte novou prázdnou hru v editoru. Uloží se až tlačítkem Uložit hru."
      );
      expect(settingsTab).toHaveAttribute(
        "title",
        "Kliknutím otevřete záložku „Nastavení“. Obsah editoru nebo hry se přepne bez automatického uložení."
      );
    });
  });

  it("zobrazí herní tabuli na /play bez globální navigace", async () => {
    window.history.pushState({}, "", "/play/riskuj-2026-06-06");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Riskuj!" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Hlavní navigace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Domů" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editor" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Riskuj 6.6" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("tablist", { name: "Kola soutěže" })).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Skóre týmů" })).toBeInTheDocument();
  });

  it("umožní ze spuštěného testu přejít zpět do adminu", async () => {
    window.history.pushState({}, "", "/play/riskuj-2026-06-06");

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Admin" }));

    expect(window.location.pathname).toBe("/");
    expect(await screen.findByLabelText("Editor hry")).toBeInTheDocument();
  });

  it("umožní z adminu pokračovat v rozehrané hře bez ztráty vybrané dlaždice", async () => {
    window.history.pushState({}, "", "/play/riskuj-2026-06-06");

    render(<App />);

    const tile = await screen.findByRole("button", {
      name: /Hudební otázky 1 za 1 000 Kč/i
    });
    fireEvent.click(tile);
    expect(tile).toHaveAttribute("data-state", "selected");

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    expect(await screen.findByLabelText("Editor hry")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vrátit se do hry" }));

    expect(window.location.pathname).toBe("/play/riskuj-2026-06-06");
    expect(
      await screen.findByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })
    ).toHaveAttribute("data-state", "selected");
  });

  it("po ukončení hry nenabízí návrat do předchozí rozehrané hry", async () => {
    window.history.pushState({}, "", "/play/riskuj-2026-06-06");

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Konec" }));
    fireEvent.click(await screen.findByRole("button", { name: "Zpět na tabuli" }));
    fireEvent.click(screen.getByRole("button", { name: "Admin" }));

    expect(window.location.pathname).toBe("/");
    expect(await screen.findByLabelText("Editor hry")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vrátit se do hry" })).not.toBeInTheDocument();
  });

  it("po potvrzení spuštění jiné hry otevře nově vybranou hru", async () => {
    const runningGame = { ...demoGame, id: "running-game", title: "Rozehraná hra" };
    const nextGame = { ...demoGame, id: "next-game", title: "Nová vybraná hra" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === "/api/games") {
          return Response.json([
            {
              id: runningGame.id,
              title: runningGame.title,
              updatedAt: runningGame.updatedAt,
              roundCount: runningGame.rounds.length
            },
            {
              id: nextGame.id,
              title: nextGame.title,
              updatedAt: nextGame.updatedAt,
              roundCount: nextGame.rounds.length
            }
          ]);
        }

        if (url === "/api/games/running-game") {
          return Response.json(runningGame);
        }

        if (url === "/api/games/next-game") {
          return Response.json(nextGame);
        }

        if (url === "/api/audio-assets") {
          return Response.json([]);
        }

        return new Response("not found", { status: 404 });
      })
    );
    window.history.pushState({}, "", "/play/running-game");

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Admin" }));
    const gameSelect = await screen.findByLabelText("Načíst existující hru");
    fireEvent.change(gameSelect, { target: { value: "next-game" } });
    fireEvent.click(screen.getByRole("button", { name: "Spustit novou hru" }));
    fireEvent.click(screen.getByRole("button", { name: "Ano" }));

    expect(window.location.pathname).toBe("/play/next-game");
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/games/next-game");
    });

    fireEvent.click(await screen.findByRole("button", { name: "Admin" }));
    fireEvent.click(await screen.findByRole("button", { name: "Vrátit se do hry" }));
    expect(window.location.pathname).toBe("/play/next-game");
  });

  it("po potvrzení spuštění stejné hry začne znovu s čistým průběhem", async () => {
    window.history.pushState({}, "", "/play/riskuj-2026-06-06");

    render(<App />);

    const tile = await screen.findByRole("button", {
      name: /Hudební otázky 1 za 1 000 Kč/i
    });
    fireEvent.click(tile);
    expect(tile).toHaveAttribute("data-state", "selected");

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    expect(await screen.findByLabelText("Editor hry")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Spustit novou hru" }));
    expect(
      screen.getByRole("alertdialog", { name: "Opravdu chcete začít novou hru?" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ano" }));

    expect(window.location.pathname).toBe("/play/riskuj-2026-06-06");
    expect(
      await screen.findByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })
    ).toHaveAttribute("data-state", "available");
  });
});
