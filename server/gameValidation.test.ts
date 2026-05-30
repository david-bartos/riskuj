import { describe, expect, it } from "vitest";
import type { Game } from "../src/types/game";
import { createEmptyGame, validateGame } from "./gameValidation";

const validGame: Game = {
  id: "valid-game",
  title: "Validní hra",
  teams: [
    { id: "team-a", name: "Tým A" },
    { id: "team-b", name: "Tým B" }
  ],
  rounds: [
    {
      id: "round-1",
      type: "question",
      title: "Otázky",
      categories: [{ id: "music", title: "Hudba" }],
      questions: [
        {
          id: "q-1",
          categoryId: "music",
          points: 100,
          prompt: "Otázka?",
          answer: "Odpověď"
        }
      ]
    },
    {
      id: "round-2",
      type: "listening",
      title: "Poslech",
      categories: [{ id: "rock", title: "Rock" }],
      tracks: [
        {
          id: "track-1",
          categoryId: "rock",
          points: 1000,
          prompt: "Poznej skladbu.",
          answer: "Queen",
          audio: { id: "audio-1", src: "/uploads/queen.mp3", title: "Ukázka" }
        }
      ]
    },
    {
      id: "round-3",
      type: "common-denominator",
      title: "Společný jmenovatel",
      clues: [{ id: "clue-1", order: 1, prompt: "Bohemian Rhapsody" }],
      answer: "Queen"
    }
  ],
  createdAt: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T00:00:00.000Z"
};

describe("validateGame", () => {
  it("přijme validní kanonickou hru", () => {
    expect(validateGame(validGame)).toEqual([]);
  });

  it("vrátí české chyby pro chybějící top-level pole", () => {
    expect(validateGame({ id: "", title: "", teams: "bad", rounds: null })).toEqual(
      expect.arrayContaining([
        "ID hry musí být neprázdný text.",
        "Název hry musí být neprázdný text.",
        "Týmy musí být pole.",
        "Kola musí být pole."
      ])
    );
  });

  it("odmítne duplicitní ID týmů a kol", () => {
    const game = {
      ...validGame,
      teams: [
        { id: "team-a", name: "Tým A" },
        { id: "team-a", name: "Tým A znovu" }
      ],
      rounds: [
        validGame.rounds[0],
        { ...validGame.rounds[0], id: "round-1", title: "Duplicitní kolo" }
      ]
    };

    expect(validateGame(game)).toEqual(
      expect.arrayContaining(["ID týmů musí být unikátní.", "ID kol musí být unikátní."])
    );
  });

  it("odmítne neznámý typ kola", () => {
    const game = {
      ...validGame,
      rounds: [{ id: "bad-round", type: "bonus", title: "Bonus" }]
    };

    expect(validateGame(game)).toContain("Kolo bad-round má neznámý typ.");
  });

  it("zkontroluje vazby položek na kategorie", () => {
    const game: Game = {
      ...validGame,
      rounds: [
        {
          id: "round-1",
          type: "question",
          title: "Otázky",
          categories: [{ id: "music", title: "Hudba" }],
          questions: [
            {
              id: "q-1",
              categoryId: "unknown",
              points: 100,
              prompt: "Otázka?",
              answer: "Odpověď"
            }
          ]
        }
      ]
    };

    expect(validateGame(game)).toContain("Otázka q-1 odkazuje na neexistující kategorii.");
  });

  it("vytvoří prázdnou hru s platným základem", () => {
    const game = createEmptyGame("Nová hra", "2026-05-30T12:00:00.000Z");

    expect(game.title).toBe("Nová hra");
    expect(game.id).toMatch(/^nova-hra-[a-z0-9]+$/);
    expect(game.teams).toEqual([]);
    expect(game.rounds).toEqual([]);
    expect(validateGame(game)).toEqual([]);
  });
});
