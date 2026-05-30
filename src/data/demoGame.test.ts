import { describe, expect, it } from "vitest";
import { demoGame } from "./demoGame";

describe("demoGame", () => {
  it("ukazuje na seed Riskuj 6.6", () => {
    expect(demoGame.id).toBe("riskuj-2026-06-06");
    expect(demoGame.title).toBe("Riskuj 6.6");
  });

  it("obsahuje šest výchozích týmů a všechna tři kola", () => {
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

  it("má otázkové kolo s hodnotami 1 000 / 3 000 / 5 000 / 10 000 Kč", () => {
    const round = demoGame.rounds.find((candidate) => candidate.type === "question");
    expect(round?.type).toBe("question");
    if (round?.type !== "question") {
      return;
    }

    expect(new Set((round.items ?? []).map((item) => item.value))).toEqual(
      new Set([1000, 3000, 5000, 10000])
    );
    expect(round.items).toHaveLength(24);
    expect(round.items?.[0]?.answer).toContain("The B-52s");
    expect(round.items?.[0]?.moderatorNote).toBeTruthy();
  });

  it("má poslechové kolo s audio položkou a skryvatelnou odpovědí", () => {
    const round = demoGame.rounds.find((candidate) => candidate.type === "listening");
    expect(round?.type).toBe("listening");
    if (round?.type !== "listening") {
      return;
    }

    expect(round.genres?.length).toBeGreaterThan(0);
    expect(round.items).toHaveLength(15);
    expect(round.items?.some((item) => item.artist === "J.A.R.")).toBe(true);
  });

  it("má kolo společného jmenovatele s clues a odpovědí", () => {
    const round = demoGame.rounds.find((candidate) => candidate.type === "common-denominator");
    expect(round?.type).toBe("common-denominator");
    if (round?.type !== "common-denominator") {
      return;
    }

    expect(round.items).toHaveLength(6);
    expect(round.items?.[0]?.clues.length).toBeGreaterThanOrEqual(2);
    expect(round.items?.[0]?.answer).toBe("HUMAN");
    expect(round.items?.[0]?.value).toBe(5000);
  });
});
