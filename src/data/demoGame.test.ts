import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demoGame } from "./demoGame";

const expectedCategoryTitles = [
  "České hity",
  "Zahraniční rock",
  "Filmová hudba",
  "Devadesátky",
  "Poznej interpreta"
];

const expectedPoints = [100, 200, 300, 400, 500];

describe("demoGame", () => {
  it("obsahuje pět českých kategorií s konzistentními otázkami", () => {
    expect(demoGame.id.trim()).not.toEqual("");
    expect(demoGame.title).toBe("Hudební Riskuj");
    expect(demoGame.categories).toHaveLength(5);
    expect(demoGame.categories.map((category) => category.title)).toEqual(expectedCategoryTitles);

    const categoryIds = new Set(demoGame.categories.map((category) => category.id));
    const questionIds = new Set<string>();

    expect(categoryIds.size).toBe(demoGame.categories.length);
    expect(demoGame.questions).toHaveLength(expectedCategoryTitles.length * expectedPoints.length);

    for (const category of demoGame.categories) {
      const categoryQuestions = demoGame.questions.filter(
        (question) => question.categoryId === category.id
      );

      expect(categoryQuestions.map((question) => question.points).sort((a, b) => a - b)).toEqual(
        expectedPoints
      );
    }

    for (const question of demoGame.questions) {
      expect(questionIds.has(question.id)).toBe(false);
      questionIds.add(question.id);
      expect(categoryIds.has(question.categoryId)).toBe(true);
      expect(expectedPoints).toContain(question.points);
      expect(question.prompt.trim()).not.toEqual("");
      expect(question.answer.trim()).not.toEqual("");
    }
  });

  it("obsahuje týmy a tři podporované typy kol", () => {
    expect(demoGame.teams.map((team) => team.name)).toEqual([
      "Tým 1",
      "Tým 2",
      "Tým 3",
      "Tým 4",
      "Tým 5",
      "Tým 6"
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
        return round.questions.flatMap((item) => (item.audio ? [item.audio] : []));
      }

      if (round.type === "listening") {
        return round.tracks.flatMap((item) => (item.audio ? [item.audio] : []));
      }

      return round.clues.flatMap((clue) => (clue.audio ? [clue.audio] : []));
    });

    expect(audioAssets.length).toBeGreaterThan(0);

    for (const audio of audioAssets) {
      expect(audio.src).toMatch(/^\/demo-audio\/.+\.mp3$/);
      expect(existsSync(path.join(process.cwd(), "public", audio.src))).toBe(true);
      expect(audio.mimeType).toBe("audio/mpeg");
      expect(audio.originalName?.trim()).not.toEqual("");
      expect(JSON.stringify(audio).toLowerCase()).not.toContain("queen");
      expect(JSON.stringify(audio).toLowerCase()).not.toContain("ivan mládek");
    }
  });

  it("má vyplněné odpovědi pro všechny typy položek", () => {
    for (const round of demoGame.rounds) {
      if (round.type === "question") {
        expect(round.categories.length).toBeGreaterThan(0);
        expect(round.questions.length).toBeGreaterThan(0);
        for (const item of round.questions) {
          expect(item.prompt.trim()).not.toEqual("");
          expect(item.answer.trim()).not.toEqual("");
        }
      }

      if (round.type === "listening") {
        expect(round.tracks.length).toBeGreaterThan(0);
        for (const item of round.tracks) {
          expect(item.prompt.trim()).not.toEqual("");
          expect((item.trackTitleAnswer ?? item.title ?? "").trim()).not.toEqual("");
          expect((item.artistAnswer ?? item.artist ?? "").trim()).not.toEqual("");
        }
      }

      if (round.type === "common-denominator") {
        expect(round.answer.trim()).not.toEqual("");
        expect(round.clues.length).toBeGreaterThan(1);
        for (const clue of round.clues) {
          expect((clue.prompt ?? "").trim()).not.toEqual("");
        }
      }
    }
  });
});
