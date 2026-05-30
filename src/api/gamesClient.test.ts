import { afterEach, describe, expect, it, vi } from "vitest";
import type { Game } from "../types/game";
import { GamesClientError, createGame, listGames, loadGame, saveGame } from "./gamesClient";

const game: Game = {
  id: "test-game",
  title: "Test hra",
  teams: [],
  rounds: [],
  categories: [],
  questions: [],
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T10:00:00.000Z"
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
    ...init
  });
}

describe("gamesClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("načte seznam her", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ id: "test-game", title: "Test hra", updatedAt: game.updatedAt, roundCount: 0 }])
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listGames()).resolves.toEqual([
      { id: "test-game", title: "Test hra", updatedAt: game.updatedAt, roundCount: 0 }
    ]);
    expect(fetchMock).toHaveBeenCalledWith("/api/games");
  });

  it("načte detail hry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(game));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadGame("test-game")).resolves.toEqual(game);
    expect(fetchMock).toHaveBeenCalledWith("/api/games/test-game");
  });

  it("vytvoří hru s názvem", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(game, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createGame({ title: "Test hra" })).resolves.toEqual(game);
    expect(fetchMock).toHaveBeenCalledWith("/api/games", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Test hra" })
    });
  });

  it("uloží kompletní hru", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(game));
    vi.stubGlobal("fetch", fetchMock);

    await expect(saveGame(game)).resolves.toEqual(game);
    expect(fetchMock).toHaveBeenCalledWith("/api/games/test-game", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(game)
    });
  });

  it("použije českou chybu ze serveru", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { message: "Hru se nepodařilo uložit.", details: ["Název hry musí být neprázdný text."] },
        { status: 400 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(saveGame({ ...game, title: "" })).rejects.toMatchObject({
      message: "Hru se nepodařilo uložit.",
      details: ["Název hry musí být neprázdný text."],
      status: 400
    });
  });

  it("použije český fallback při nečitelném serveru", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = loadGame("test-game");

    await expect(promise).rejects.toBeInstanceOf(GamesClientError);
    await expect(promise).rejects.toMatchObject({
      message: "Server vrátil nečitelnou odpověď.",
      status: 500
    });
  });

  it("použije český fallback při výpadku sítě", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Network failed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listGames()).rejects.toMatchObject({
      message: "Nepodařilo se spojit se serverem."
    });
  });
});
