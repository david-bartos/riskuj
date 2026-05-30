import { describe, expect, it } from "vitest";
import { demoGame } from "./demoGame";

describe("demoGame", () => {
  it("obsahuje data pro vsechna tri kola", () => {
    expect(demoGame.categories.length).toBeGreaterThan(0);
    expect(demoGame.questions.length).toBeGreaterThan(0);
    expect(demoGame.listeningGenres).toHaveLength(2);
    expect(demoGame.listeningItems[0]).toMatchObject({
      title: "Shallow",
      answer: "Shallow ze Zrodila se hvezda"
    });
    expect(demoGame.commonDenominator).toMatchObject({
      answer: "Queen"
    });
    expect(demoGame.commonDenominator.clues).toHaveLength(3);
  });
});
