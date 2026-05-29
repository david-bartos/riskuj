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
const demoAudioSrc = "/uploads/demo-placeholder.mp3";

describe("demoGame", () => {
  it("obsahuje pět českých kategorií s konzistentními otázkami", () => {
    expect(demoGame.id.trim()).not.toEqual("");
    expect(demoGame.title).toBe("Hudební Riskuj");
    expect(demoGame.categories).toHaveLength(5);
    expect(demoGame.categories.map((category) => category.title)).toEqual(expectedCategoryTitles);

    const categoryIds = new Set(demoGame.categories.map((category) => category.id));
    const questionIds = new Set<string>();
    const audioIds = new Set<string>();

    expect(categoryIds.size).toBe(demoGame.categories.length);
    expect(demoGame.questions).toHaveLength(expectedCategoryTitles.length * expectedPoints.length);

    for (const category of demoGame.categories) {
      expect(category.id.trim()).not.toEqual("");
      expect(category.title.trim()).not.toEqual("");

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

      expect(question.id.trim()).not.toEqual("");
      expect(categoryIds.has(question.categoryId)).toBe(true);
      expect(expectedPoints).toContain(question.points);
      expect(question.prompt.trim()).not.toEqual("");
      expect(question.answer.trim()).not.toEqual("");

      if (question.moderatorNote) {
        expect(question.moderatorNote.trim()).not.toEqual("");
      }

      if (question.audio) {
        expect(audioIds.has(question.audio.id)).toBe(false);
        audioIds.add(question.audio.id);
        expect(question.audio.id.trim()).not.toEqual("");
        expect(question.audio.src).toBe(demoAudioSrc);
        expect(question.audio.title.trim()).not.toEqual("");
      }
    }

    expect(audioIds.size).toBeGreaterThan(1);
  });
});
