import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

    const savedJson = await readFile(join(gamesDir, "test-game", "game.json"), "utf8");
    expect(JSON.parse(savedJson)).toEqual(game);
    expect(savedJson.endsWith("\n")).toBe(true);

    await expect(storage.loadGame("test-game")).resolves.toEqual(game);
  });

  it("vrati null pri nacitani neexistujici hry", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });

    await expect(storage.loadGame("missing-game")).resolves.toBeNull();
  });

  it("vypise validni JSON hry podle nazvu souboru a ignoruje ostatni soubory", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });
    const firstGame = createValidGame({ id: "a-game", title: "A Game" });
    const secondGame = createValidGame({ id: "b-game", title: "B Game" });

    await mkdir(gamesDir, { recursive: true });
    await mkdir(join(gamesDir, "b-game"), { recursive: true });
    await mkdir(join(gamesDir, "a-game"), { recursive: true });
    await writeFile(join(gamesDir, "b-game", "game.json"), JSON.stringify(secondGame), "utf8");
    await writeFile(join(gamesDir, "notes.txt"), "ignore me", "utf8");
    await writeFile(join(gamesDir, "a-game", "game.json"), JSON.stringify(firstGame), "utf8");

    await expect(storage.listGames()).resolves.toEqual([firstGame, secondGame]);
  });

  it("vrati prazdny seznam, kdyz adresar her neexistuje", async () => {
    const gamesDir = join(await createTempGamesDir(), "missing");
    const storage = createGameStorage({ gamesDir });

    await expect(storage.listGames()).resolves.toEqual([]);
  });

  it("odmitne ulozit hru bez povinnych poli", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });
    const invalidGame = { ...createValidGame(), questions: "not an array" };

    await expect(storage.saveGame(invalidGame as unknown as Game)).rejects.toThrow(
      "Invalid game: questions must be an array",
    );
  });

  it("odmitne nacist kategorii bez povinnych string poli", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });
    const invalidGame = createValidGame({
      categories: [{ id: "music", title: 123 as unknown as string }],
    });

    await mkdir(join(gamesDir, "test-game"), { recursive: true });
    await writeFile(join(gamesDir, "test-game", "game.json"), JSON.stringify(invalidGame), "utf8");

    await expect(storage.loadGame("test-game")).rejects.toThrow(
      "Invalid game: categories[0].title must be a string",
    );
  });

  it("odmitne nacist otazku bez povinnych string poli", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });
    const invalidGame = createValidGame({
      questions: [
        {
          ...createValidGame().questions[0],
          answer: undefined as unknown as string,
        },
      ],
    });

    await mkdir(join(gamesDir, "test-game"), { recursive: true });
    await writeFile(join(gamesDir, "test-game", "game.json"), JSON.stringify(invalidGame), "utf8");

    await expect(storage.loadGame("test-game")).rejects.toThrow(
      "Invalid game: questions[0].answer must be a string",
    );
  });


  it("odmitne game id, ktere neni bezpecny nazev adresare", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });
    const invalidGame = createValidGame({ id: "../utek" });

    await expect(storage.saveGame(invalidGame)).rejects.toThrow(
      "Invalid game: id must contain only letters, numbers, underscores or hyphens",
    );
    await expect(storage.loadGame("../utek")).rejects.toThrow(
      "Invalid game: id must contain only letters, numbers, underscores or hyphens",
    );
  });

  it("validuje volitelne moderatorNote a audio metadata", async () => {
    const gamesDir = await createTempGamesDir();
    const storage = createGameStorage({ gamesDir });
    const invalidGame = createValidGame({
      questions: [
        {
          ...createValidGame().questions[0],
          moderatorNote: 42 as unknown as string,
          audio: {
            id: "audio-1",
            src: "/audio/audio-1.mp3",
            title: "Ukazka",
            durationSeconds: "30" as unknown as number,
          },
        },
      ],
    });

    await mkdir(join(gamesDir, "test-game"), { recursive: true });
    await writeFile(join(gamesDir, "test-game", "game.json"), JSON.stringify(invalidGame), "utf8");

    await expect(storage.loadGame("test-game")).rejects.toThrow(
      "Invalid game: questions[0].moderatorNote must be a string",
    );
  });
});
