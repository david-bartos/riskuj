import { describe, expect, it } from "vitest";
import { demoGame, demoQuestionPoints } from "./demoGame";

const expectedPoints = [100, 200, 300, 400, 500];

describe("demoGame", () => {
  it("obsahuje kanonický model s jedním otázkovým kolem", () => {
    expect(demoGame.id).toBe("demo-hudebni-riskuj");
    expect(demoGame.title).toBe("Hudební Riskuj");
    expect(demoGame.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(demoGame.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(demoGame.teams).toHaveLength(6);
    expect(new Set(demoGame.teams.map((team) => team.id)).size).toBe(6);
    expect(demoGame.rounds).toHaveLength(1);

    const [round] = demoGame.rounds;
    expect(round.type).toBe("question");

    if (round.type !== "question") {
      throw new Error("Demo round má být otázkové kolo.");
    }

    expect(round.categories.map((category) => category.title)).toEqual([
      "České hity",
      "Zahraniční rock",
      "Filmová hudba",
      "Devadesátky",
      "Poznej interpreta"
    ]);

    const categoryIds = new Set(round.categories.map((category) => category.id));
    const questionIds = new Set<string>();
    const audioIds = new Set<string>();

    expect(categoryIds.size).toBe(round.categories.length);

    for (const category of round.categories) {
      const categoryQuestions = round.questions.filter(
        (question) => question.categoryId === category.id
      );

      expect(categoryQuestions.map((question) => question.points).sort((a, b) => a - b)).toEqual(
        expectedPoints
      );
    }

    for (const question of round.questions) {
      expect(questionIds.has(question.id)).toBe(false);
      questionIds.add(question.id);
      expect(categoryIds.has(question.categoryId)).toBe(true);
      expect(expectedPoints).toContain(question.points);
      expect(question.prompt.trim()).not.toEqual("");
      expect(question.answer.trim()).not.toEqual("");

      if (question.audio) {
        expect(audioIds.has(question.audio.id)).toBe(false);
        audioIds.add(question.audio.id);
        expect(question.audio.src).toMatch(/^\/uploads\/.+\.mp3$/);
        expect(question.audio.title?.trim()).not.toEqual("");
      }
    }

    expect(questionIds.size).toBe(25);
    expect(round.questions.some((question) => question.audio)).toBe(true);
    expect(demoQuestionPoints).toEqual(expectedPoints);
  });
});
