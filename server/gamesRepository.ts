import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Game, GameSummary } from "../src/types/game";
import { assertValidGame } from "./gameValidation";

export class GamesRepository {
  constructor(private readonly gamesDirectory = path.resolve("data/games")) {}

  async list(): Promise<GameSummary[]> {
    await mkdir(this.gamesDirectory, { recursive: true });

    const entries = await readdir(this.gamesDirectory);
    const summaries = await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".json"))
        .map(async (entry) => {
          const raw = await readFile(path.join(this.gamesDirectory, entry), "utf8");
          const parsed = JSON.parse(raw) as unknown;
          assertValidGame(parsed);
          return createGameSummary(parsed);
        })
    );

    return summaries.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async load(id: string): Promise<Game | null> {
    const filePath = this.getGamePath(id);

    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      assertValidGame(parsed);
      return parsed;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  async save(game: Game): Promise<Game> {
    assertValidGame(game);
    const filePath = this.getGamePath(game.id);

    await mkdir(this.gamesDirectory, { recursive: true });
    await writeFile(filePath, `${JSON.stringify(game, null, 2)}\n`, "utf8");

    return game;
  }

  private getGamePath(id: string) {
    if (!isSafeGameId(id)) {
      throw new Error("Neplatné ID hry.");
    }

    return path.join(this.gamesDirectory, `${id}.json`);
  }
}

export function createGameSummary(game: Game): GameSummary {
  return {
    id: game.id,
    title: game.title,
    updatedAt: game.updatedAt,
    roundCount: game.rounds.length
  };
}

export function isSafeGameId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
