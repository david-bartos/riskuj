import { afterEach, describe, expect, it, vi } from "vitest";
import { demoGame } from "../data/demoGame";
import type { Game } from "../types/game";
import {
  GamesClientError,
  createGame,
  gamesClient,
  listGames,
  loadGame,
  saveGame,
  uploadAudio
} from "./gamesClient";

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

  it("při výpadku sítě vrátí lokální seznam demo her", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Network failed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listGames()).resolves.toEqual([
      expect.objectContaining({ id: demoGame.id, title: demoGame.title })
    ]);
  });

  it("při nedostupném API načte demo hru z lokální zálohy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(gamesClient.loadGame(demoGame.id)).resolves.toMatchObject({
      id: demoGame.id,
      title: demoGame.title
    });
  });

  it("nahraje MP3 soubor do upload endpointu", async () => {
    const file = new File(["ID3"], "intro.mp3", { type: "audio/mpeg" });
    const asset = { id: "audio-1", src: "/uploads/audio-1.mp3", title: "intro" };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(asset));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadAudio(file)).resolves.toEqual(asset);
    expect(fetchMock).toHaveBeenCalledWith("/api/uploads/audio", {
      method: "POST",
      body: expect.any(FormData)
    });
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("file")).toBe(file);
  });

  it("mapuje backend chybu pro jiný než MP3 soubor do češtiny", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Only MP3 audio uploads are supported." }, { status: 400 })
      )
    );

    await expect(
      uploadAudio(new File(["x"], "notes.txt", { type: "text/plain" }))
    ).rejects.toMatchObject({
      message: "Nahrajte prosím soubor MP3.",
      status: 400
    });
  });

  it("mapuje backend chybu pro chybějící soubor do češtiny", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: 'MP3 file is required in multipart field "file".' },
          { status: 400 }
        )
      )
    );

    await expect(
      uploadAudio(new File([""], "empty.mp3", { type: "audio/mpeg" }))
    ).rejects.toMatchObject({
      message: "Vyberte prosím MP3 soubor k nahrání.",
      status: 400
    });
  });

  it("mapuje výpadek sítě při uploadu do bezpečné české chyby", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(
      uploadAudio(new File(["ID3"], "intro.mp3", { type: "audio/mpeg" }))
    ).rejects.toMatchObject({
      message: "Audio se nepodařilo nahrát. Zkontrolujte připojení a zkuste to znovu."
    });
  });
});
