import { describe, expect, it } from "vitest";
import { demoGame } from "../data/demoGame";
import type { Game } from "../types/game";
import { GameJsonValidationError, parseGameJson, serializeGameToJson } from "./gameJson";

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    ...demoGame,
    id: "import-test",
    title: "Import test",
    updatedAt: "2026-05-30T12:00:00.000Z",
    ...overrides
  };
}

describe("gameJson", () => {
  it("exportuje a znovu importuje hru bez ztráty otázek a audio cest", () => {
    const game = makeGame();

    const parsed = parseGameJson(serializeGameToJson(game));

    expect(parsed.title).toBe(game.title);
    expect(parsed.questions).toEqual(game.questions);
    expect(parsed.rounds).toEqual(game.rounds);
    expect(JSON.stringify(parsed)).toContain("/uploads/riskuj-66-listen-01.mp3");
  });

  it("odmítne nepodporovaný formát importu českou validační chybou", () => {
    const text = JSON.stringify({
      format: "riskuj-game/v0",
      exportedAt: "2026-05-30T12:00:00.000Z",
      game: makeGame()
    });

    expect(() => parseGameJson(text)).toThrow(GameJsonValidationError);
    expect(() => parseGameJson(text)).toThrow(
      "Nepodporovaný formát importu: riskuj-game/v0. Očekává se riskuj-game/v1."
    );
  });

  it("odmítne duplicitní ID otázky v prvním kole", () => {
    const game = makeGame({
      questions: [demoGame.questions![0], demoGame.questions![1]],
      rounds: [
        {
          id: "round-otazky",
          type: "question",
          title: "Riskuj",
          categories: demoGame.categories!,
          questions: [
            { ...demoGame.questions![0], id: "duplicitni-otazka" },
            { ...demoGame.questions![1], id: "duplicitni-otazka" }
          ]
        }
      ]
    });
    const text = JSON.stringify({
      format: "riskuj-game/v1",
      exportedAt: "2026-05-30T12:00:00.000Z",
      game
    });

    expect(() => parseGameJson(text)).toThrow(
      "Duplicitní ID v game.rounds[0].questions: duplicitni-otazka."
    );
  });

  it("odmítne audio cestu mimo uploads nebo demo audio složku", () => {
    const game = makeGame({
      questions: [
        {
          ...demoGame.questions![0],
          audio: { id: "audio-bad", src: "file:///tmp/song.mp3", title: "Bad" }
        }
      ]
    });
    const text = JSON.stringify({
      format: "riskuj-game/v1",
      exportedAt: "2026-05-30T12:00:00.000Z",
      game
    });

    expect(() => parseGameJson(text)).toThrow(
      "Neplatná cesta k audio souboru v game.questions[0].audio.src. Použijte /uploads/nazev.mp3."
    );
  });
});
