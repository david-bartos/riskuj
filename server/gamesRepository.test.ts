import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Game } from "../src/types/game";
import { GamesRepository, isSafeGameId } from "./gamesRepository";

let tempDir: string;

const gameA: Game = {
  id: "game-a",
  title: "Hra A",
  teams: [],
  rounds: [],
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T11:00:00.000Z"
};

const gameB: Game = {
  id: "game-b",
  title: "Hra B",
  teams: [],
  rounds: [
    {
      id: "round-1",
      type: "common-denominator",
      title: "Společný jmenovatel",
      clues: [{ id: "clue-1", order: 1, prompt: "Mercury" }],
      answer: "Queen"
    }
  ],
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T12:00:00.000Z"
};

describe("GamesRepository", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "riskuj-games-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("rozpozná bezpečné ID hry", () => {
    expect(isSafeGameId("demo-hra_1")).toBe(true);
    expect(isSafeGameId("../secret")).toBe(false);
    expect(isSafeGameId("hra.json")).toBe(false);
    expect(isSafeGameId("")).toBe(false);
  });

  it("uloží a načte hru z JSON souboru", async () => {
    const repository = new GamesRepository(tempDir);

    await repository.save(gameA);

    await expect(repository.load("game-a")).resolves.toEqual(gameA);
  });

  it("vrátí null pro neexistující hru", async () => {
    const repository = new GamesRepository(tempDir);

    await expect(repository.load("missing")).resolves.toBeNull();
  });

  it("vypíše souhrny seřazené od nejnovější hry", async () => {
    const repository = new GamesRepository(tempDir);

    await repository.save(gameA);
    await repository.save(gameB);

    await expect(repository.list()).resolves.toEqual([
      {
        id: "game-b",
        title: "Hra B",
        updatedAt: "2026-05-30T12:00:00.000Z",
        roundCount: 1
      },
      {
        id: "game-a",
        title: "Hra A",
        updatedAt: "2026-05-30T11:00:00.000Z",
        roundCount: 0
      }
    ]);
  });

  it("odmítne nebezpečnou cestu", async () => {
    const repository = new GamesRepository(tempDir);

    await expect(repository.load("../secret")).rejects.toThrow("Neplatné ID hry.");
  });
});
