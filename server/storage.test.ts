import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Game } from "../src/types/game";
import { createGameStorage } from "./storage";

const tempDirs: string[] = [];

async function createTempGamesDir() {
  const gamesDir = await mkdtemp(join(tmpdir(), "riskuj-games-"));
  tempDirs.push(gamesDir);
  return gamesDir;
}

function createValidGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "test-game",
    title: "Testovaci hra",
    categories: [{ id: "music", title: "Hudba" }],
    questions: [
      {
        id: "music-100",
        categoryId: "music",
        points: 100,
        prompt: "Otazka?",
        answer: "Odpoved",
      },
    ],
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("game storage", () => {
  it("ulozi a nacte validni hru z injektovaneho adresare", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });
    const game = createValidGame();

    await expect(storage.saveGame(game)).resolves.toEqual(game);

    const savedJson = await readFile(join(gamesDir, "test-game.json"), "utf8");
    expect(JSON.parse(savedJson)).toEqual(game);
    expect(savedJson.endsWith("\n")).toBe(true);

    await expect(storage.loadGame("test-game")).resolves.toEqual(game);
  });
});
