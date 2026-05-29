import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
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
const gameJsonFilename = "game.json";

function gameDirPath(gamesDir: string, id: string) {
  return path.join(gamesDir, id);
}

function gameFilePath(gamesDir: string, id: string) {
  return path.join(gameDirPath(gamesDir, id), gameJsonFilename);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new Error(`Invalid game: ${field} must be a string`);
  }
}

function validateAudio(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid game: ${field} must be an object`);
  }

  const audio = value as Record<string, unknown>;
  requireString(audio.id, `${field}.id`);
  requireString(audio.src, `${field}.src`);
  requireString(audio.title, `${field}.title`);

  if (
    audio.durationSeconds !== undefined &&
    typeof audio.durationSeconds !== "number"
  ) {
    throw new Error(`Invalid game: ${field}.durationSeconds must be a number`);
  }
}

export function validateGame(value: unknown): Game {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid game: expected object");
  }

  const game = value as Partial<Game>;

  requireString(game.id, "id");
  requireString(game.title, "title");

  if (!Array.isArray(game.categories)) {
    throw new Error("Invalid game: categories must be an array");
  }

  if (!Array.isArray(game.questions)) {
    throw new Error("Invalid game: questions must be an array");
  }

  game.categories.forEach((category, index) => {
    if (!category || typeof category !== "object" || Array.isArray(category)) {
      throw new Error(`Invalid game: categories[${index}] must be an object`);
    }

    const categoryRecord = category as unknown as Record<string, unknown>;
    requireString(categoryRecord.id, `categories[${index}].id`);
    requireString(categoryRecord.title, `categories[${index}].title`);
  });

  game.questions.forEach((question, index) => {
    if (!question || typeof question !== "object" || Array.isArray(question)) {
      throw new Error(`Invalid game: questions[${index}] must be an object`);
    }

    const questionRecord = question as unknown as Record<string, unknown>;
    requireString(questionRecord.id, `questions[${index}].id`);
    requireString(questionRecord.categoryId, `questions[${index}].categoryId`);
    requireString(questionRecord.prompt, `questions[${index}].prompt`);
    requireString(questionRecord.answer, `questions[${index}].answer`);

    if (
      questionRecord.moderatorNote !== undefined &&
      typeof questionRecord.moderatorNote !== "string"
    ) {
      throw new Error(
        `Invalid game: questions[${index}].moderatorNote must be a string`,
      );
    }

    if (questionRecord.audio !== undefined) {
      validateAudio(questionRecord.audio, `questions[${index}].audio`);
    }
  });

  return game as Game;
}

export function createGameStorage(options: GameStorageOptions = {}): GameStorage {
  const gamesDir = options.gamesDir ?? defaultGamesDir;

  return {
    async listGames() {
      let entries: string[];

      try {
        entries = await readdir(gamesDir);
      } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") {
          return [];
        }

        throw error;
      }

      const games: Game[] = [];

      for (const entry of entries.sort()) {
        const entryPath = path.join(gamesDir, entry);
        const entryStat = await stat(entryPath);

        if (!entryStat.isDirectory()) {
          continue;
        }

        const json = await readFile(path.join(entryPath, gameJsonFilename), "utf8");
        games.push(validateGame(JSON.parse(json)));
      }

      return games;
    },

    async loadGame(id) {
      try {
        const json = await readFile(gameFilePath(gamesDir, id), "utf8");
        return validateGame(JSON.parse(json));
      } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") {
          return null;
        }

        throw error;
      }
    },

    async saveGame(game) {
      const validatedGame = validateGame(game);
      await mkdir(gameDirPath(gamesDir, validatedGame.id), { recursive: true });
      await writeFile(
        gameFilePath(gamesDir, validatedGame.id),
        `${JSON.stringify(validatedGame, null, 2)}
`,
        "utf8",
      );
      return validatedGame;
    },
  };
}

export const gameStorage = createGameStorage();
