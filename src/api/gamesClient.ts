import type { Game, GameSummary } from "../types/game";
export type { GameSummary } from "../types/game";
import { demoGame } from "../data/demoGame";

export class GamesClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details: string[] = []
  ) {
    super(message);
    this.name = "GamesClientError";
  }
}

const localGames = new Map<string, Game>([[demoGame.id, demoGame]]);

export async function listGames(): Promise<GameSummary[]> {
  try {
    return await requestJson<GameSummary[]>("/api/games");
  } catch {
    return Array.from(localGames.values()).map((game) => ({
      id: game.id,
      title: game.title,
      updatedAt: game.updatedAt,
      roundCount: game.rounds.length,
    }));
  }
}

export async function loadGame(id: string): Promise<Game> {
  try {
    return await requestJson<Game>(`/api/games/${encodeURIComponent(id)}`);
  } catch (error) {
    const game = localGames.get(id);
    if (game) {
      return cloneGame(game);
    }
    if (error instanceof GamesClientError) {
      throw error;
    }
    throw wrapFallbackError("Hru se nepodařilo načíst", error);
  }
}

export async function createGame(input: { title?: string } | Game = {}): Promise<Game> {
  return requestJson<Game>("/api/games", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function saveGame(game: Game): Promise<Game> {
  try {
    return await requestJson<Game>(`/api/games/${encodeURIComponent(game.id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(game)
    });
  } catch (error) {
    if (error instanceof GamesClientError && error.status !== undefined) {
      throw error;
    }
    localGames.set(game.id, cloneGame(game));
    return cloneGame(game);
  }
}

export const gamesClient = {
  listGames,
  loadGame,
  createGame,
  saveGame,
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = init ? await fetch(url, init) : await fetch(url);
  } catch {
    throw new GamesClientError("Nepodařilo se spojit se serverem.");
  }

  const body = await readJsonResponse<unknown>(response);

  if (!response.ok) {
    throw createHttpError(response, body);
  }

  return body as T;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new GamesClientError("Server vrátil nečitelnou odpověď.", response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new GamesClientError("Server vrátil nečitelnou odpověď.", response.status);
  }
}

function createHttpError(response: Response, body: unknown) {
  if (isErrorBody(body)) {
    return new GamesClientError(body.message, response.status, readDetails(body));
  }

  return new GamesClientError("Požadavek na hry selhal.", response.status);
}

function isErrorBody(value: unknown): value is { message: string; details?: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

function readDetails(body: { details?: unknown }) {
  if (!Array.isArray(body.details)) {
    return [];
  }

  return body.details.filter((detail): detail is string => typeof detail === "string");
}

function cloneGame(game: Game): Game {
  return structuredClone(game);
}

function wrapFallbackError(action: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : "neznámá chyba";
  return new Error(`${action}: ${detail}`);
}
