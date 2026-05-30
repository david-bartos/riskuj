import { describe, expect, it } from "vitest";
import { demoGame } from "./demoGame";

describe("demoGame", () => {
  it("obsahuje týmy a tři podporované typy kol", () => {
    expect(demoGame.id).toBe("demo-hudebni-riskuj");
    expect(demoGame.teams.map((team) => team.name)).toEqual([
      "Tým 1",
      "Tým 2",
      "Tým 3"
    ]);
    expect(demoGame.rounds.map((round) => round.type)).toEqual([
      "question",
      "listening",
      "common-denominator"
    ]);
  });

  it("drží audio assety neutrální a tajné odpovědi mimo metadata", () => {
    const audioAssets = demoGame.rounds.flatMap((round) => {
      if (round.type === "question") {
        return round.items.flatMap((item) => (item.audio ? [item.audio] : []));
      }

      if (round.type === "listening") {
        return round.items.flatMap((item) => (item.audio ? [item.audio] : []));
      }

      return round.clues.flatMap((clue) => (clue.audio ? [clue.audio] : []));
    });

    expect(audioAssets.length).toBeGreaterThan(0);

    for (const audio of audioAssets) {
      expect(audio.src).toMatch(/^\/uploads\/.+\.mp3$/);
      expect(audio.mimeType).toBe("audio/mpeg");
      expect(audio.originalName.trim()).not.toEqual("");
      expect(JSON.stringify(audio).toLowerCase()).not.toContain("queen");
      expect(JSON.stringify(audio).toLowerCase()).not.toContain("ivan mládek");
    }
  });

  it("má vyplněné odpovědi pro všechny typy položek", () => {
    for (const round of demoGame.rounds) {
      if (round.type === "question") {
        expect(round.categories.length).toBeGreaterThan(0);
        expect(round.items.length).toBeGreaterThan(0);
        for (const item of round.items) {
          expect(item.prompt.trim()).not.toEqual("");
          expect(item.answer.trim()).not.toEqual("");
        }
      }

      if (round.type === "listening") {
        expect(round.items.length).toBeGreaterThan(0);
        for (const item of round.items) {
          expect(item.prompt.trim()).not.toEqual("");
          expect(item.trackTitleAnswer.trim()).not.toEqual("");
          expect(item.artistAnswer.trim()).not.toEqual("");
        }
      }

      if (round.type === "common-denominator") {
        expect(round.answer.trim()).not.toEqual("");
        expect(round.clues.length).toBeGreaterThan(1);
        for (const clue of round.clues) {
          expect(clue.prompt.trim()).not.toEqual("");
        }
      }
    }
  });
});
