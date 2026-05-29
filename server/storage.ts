import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Game } from "../src/types/game";

export type GameStorage = {
  listGames(): Promise<Game[]>;
  loadGame(id: string): Promise<Game | null>;
  saveGame(game: Game): Promise<Game>;
};

export type GameStorageOptions = {
  gamesDir?: string;
};

const defaultGamesDir = path.resolve(process.cwd(), "data/games");

function gameFilePath(gamesDir: string, id: string) {
  return path.join(gamesDir, `${id}.json`);
}

export function validateGame(value: unknown): Game {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid game: expected object");
  }

  const game = value as Partial<Game>;

  if (typeof game.id !== "string") {
    throw new Error("Invalid game: id must be a string");
  }

  if (typeof game.title !== "string") {
    throw new Error("Invalid game: title must be a string");
  }

  if (!Array.isArray(game.categories)) {
    throw new Error("Invalid game: categories must be an array");
  }

  if (!Array.isArray(game.questions)) {
    throw new Error("Invalid game: questions must be an array");
  }

  return game as Game;
}

export function createGameStorage(options: GameStorageOptions = {}): GameStorage {
  const gamesDir = options.gamesDir ?? defaultGamesDir;

  return {
    async listGames() {
      return [];
    },

    async loadGame(id) {
      try {
        const json = await readFile(gameFilePath(gamesDir, id), "utf8");
        return validateGame(JSON.parse(json));
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return null;
        }

        throw error;
      }
    },

    async saveGame(game) {
      const validatedGame = validateGame(game);
      await mkdir(gamesDir, { recursive: true });
      await writeFile(
        gameFilePath(gamesDir, validatedGame.id),
        `${JSON.stringify(validatedGame, null, 2)}\n`,
        "utf8",
      );
      return validatedGame;
    },
  };
}

export const gameStorage = createGameStorage();
