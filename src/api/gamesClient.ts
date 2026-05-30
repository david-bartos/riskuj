import { demoGame } from "../data/demoGame";
import type { Game } from "../types/game";

export interface GameSummary {
  id: string;
  title: string;
}

const localGames = new Map<string, Game>([[demoGame.id, demoGame]]);

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function cloneGame(game: Game): Game {
  return structuredClone(game);
}

function wrapGamesError(action: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : "neznama chyba";
  return new Error(`${action}: ${detail}`);
}

export const gamesClient = {
  async listGames(): Promise<GameSummary[]> {
    try {
      return await requestJson<GameSummary[]>("/api/games");
    } catch {
      return Array.from(localGames.values()).map((game) => ({
        id: game.id,
        title: game.title
      }));
    }
  },

  async loadGame(gameId: string): Promise<Game> {
    try {
      return await requestJson<Game>(`/api/games/${encodeURIComponent(gameId)}`);
    } catch (error) {
      const game = localGames.get(gameId);
      if (game) {
        return cloneGame(game);
      }
      throw wrapGamesError("Hru se nepodarilo nacist", error);
    }
  },

  async saveGame(game: Game): Promise<Game> {
    try {
      return await requestJson<Game>(`/api/games/${encodeURIComponent(game.id)}`, {
        method: "PUT",
        body: JSON.stringify(game)
      });
    } catch {
      localGames.set(game.id, cloneGame(game));
      return cloneGame(game);
    }
  }
};
