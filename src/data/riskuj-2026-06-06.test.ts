import { describe, expect, it } from "vitest";
import { validateGame } from "../../server/gameValidation";
import { riskuj20260606Game } from "./riskuj-2026-06-06";
import { getSeedGame, listSeedGames } from "./games";

describe("riskuj20260606Game", () => {
  it("je validní vůči datovému modelu", () => {
    expect(validateGame(riskuj20260606Game)).toEqual([]);
  });

  it("obsahuje 6 týmů pro kvíz 6.6", () => {
    expect(riskuj20260606Game.teams.map((team) => team.name)).toEqual([
      "Tým 1",
      "Tým 2",
      "Tým 3",
      "Tým 4",
      "Tým 5",
      "Tým 6"
    ]);
  });

  it("obsahuje 1. kolo s 24 otázkami a distribucí hodnot", () => {
    const round = riskuj20260606Game.rounds.find((item) => item.type === "question");
    expect(round?.type).toBe("question");
    if (!round || round.type !== "question") throw new Error("Missing question round");

    const items = round.items ?? round.questions;

    expect(items).toHaveLength(24);
    expect(items.filter((item) => item.value === 1000)).toHaveLength(6);
    expect(items.filter((item) => item.value === 3000)).toHaveLength(6);
    expect(items.filter((item) => item.value === 5000)).toHaveLength(6);
    expect(items.filter((item) => item.value === 10000)).toHaveLength(6);

    for (const item of items) {
      expect(item.prompt.trim()).not.toEqual("");
      expect(item.answer.trim()).not.toEqual("");
      expect(item.moderatorNote?.trim()).not.toEqual("");
      expect(item.reviewStatus).toBe("needs-source");
    }
  });

  it("obsahuje 2. kolo s explicitně označenými nejasnostmi", () => {
    const round = riskuj20260606Game.rounds.find((item) => item.type === "listening");
    expect(round?.type).toBe("listening");
    if (!round || round.type !== "listening") throw new Error("Missing listening round");

    const items = round.items ?? round.tracks;

    expect(items).toHaveLength(15);
    expect(riskuj20260606Game.knownIssues?.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["listening-count-mismatch", "jar-missing-track-title"])
    );
    expect(items.some((item) => item.knownIssueIds?.includes("jar-missing-track-title"))).toBe(
      true
    );
  });

  it("obsahuje 3. kolo se 6 společnými jmenovateli", () => {
    const round = riskuj20260606Game.rounds.find(
      (item) => item.type === "common-denominator"
    );
    expect(round?.type).toBe("common-denominator");
    if (!round || round.type !== "common-denominator") {
      throw new Error("Missing common denominator round");
    }

    const items = round.items ?? [];

    expect(items).toHaveLength(6);
    for (const item of items) {
      expect(item.clues.length).toBeGreaterThan(0);
      expect(item.answer.trim()).not.toEqual("");
      expect(item.reviewStatus).toBe("needs-source");
    }
  });

  it("je dostupná přes seed registry", () => {
    expect(getSeedGame("riskuj-2026-06-06")?.title).toBe("Riskuj 6.6");
    expect(listSeedGames()).toContainEqual(
      expect.objectContaining({
        id: "riskuj-2026-06-06",
        title: "Riskuj 6.6",
        teamCount: 6,
        roundCount: 3
      })
    );
  });
});
