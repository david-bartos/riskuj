import type { MoneyValue, RoundType } from "./game";

export type PresenterStep =
  | "board"
  | "item-selected"
  | "prompt-visible"
  | "answer-visible"
  | "scoring";

export interface ActiveItemRef {
  roundId: string;
  roundType: RoundType;
  itemId: string;
}

export interface TeamSessionScore {
  teamId: string;
  score: number;
}

export interface ListeningScoringDraft {
  [teamId: string]: MoneyValue;
}

export interface ItemAward {
  teamId?: string;
  value: number;
}

export interface GameSession {
  gameId: string;
  teamScores: TeamSessionScore[];
  activeRoundId: string;
  activeTeamId?: string;
  activeItem?: ActiveItemRef;
  presenterStep: PresenterStep;
  completedItemIds: string[];
  revealedClueIds: string[];
  listeningScoringDraft: ListeningScoringDraft;
  itemAwards: Record<string, ItemAward>;
}

