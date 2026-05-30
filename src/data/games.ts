import type { Game } from "../types/game";
import { riskuj20260606Game } from "./riskuj-2026-06-06";

export const seedGames: Game[] = [riskuj20260606Game];

export function listSeedGames() {
  return seedGames.map((game) => ({
    id: game.id,
    title: game.title,
    updatedAt: game.updatedAt,
    roundCount: game.rounds.length,
    teamCount: game.teams.length,
    knownIssueCount: game.knownIssues?.length ?? 0
  }));
}

export function getSeedGame(gameId: string): Game | undefined {
  return seedGames.find((game) => game.id === gameId);
}
