export type GameRoundType = "question" | "listening" | "common-denominator";

export type QuestionPoints = number;

export interface AudioAsset {
  id: string;
  src: string;
  title?: string;
  artist?: string;
  durationSeconds?: number;
}

export interface Team {
  id: string;
  name: string;
  color?: string;
}

export interface QuestionCategory {
  id: string;
  title: string;
}

export interface QuestionItem {
  id: string;
  categoryId: string;
  points: QuestionPoints;
  prompt: string;
  answer: string;
  moderatorNote?: string;
  audio?: AudioAsset;
}

export interface ListeningCategory {
  id: string;
  title: string;
}

export interface ListeningItem {
  id: string;
  categoryId: string;
  points: QuestionPoints;
  prompt: string;
  answer: string;
  audio?: AudioAsset;
  moderatorNote?: string;
}

export interface CommonDenominatorClue {
  id: string;
  order: number;
  prompt: string;
  answer?: string;
  audio?: AudioAsset;
}

export interface BaseRound {
  id: string;
  title: string;
  type: GameRoundType;
}

export interface QuestionRound extends BaseRound {
  type: "question";
  categories: QuestionCategory[];
  questions: QuestionItem[];
}

export interface ListeningRound extends BaseRound {
  type: "listening";
  categories: ListeningCategory[];
  tracks: ListeningItem[];
}

export interface CommonDenominatorRound extends BaseRound {
  type: "common-denominator";
  clues: CommonDenominatorClue[];
  answer: string;
}

export type GameRound = QuestionRound | ListeningRound | CommonDenominatorRound;

export interface Game {
  id: string;
  title: string;
  teams: Team[];
  rounds: GameRound[];
  createdAt: string;
  updatedAt: string;
}

export interface GameSummary {
  id: string;
  title: string;
  updatedAt: string;
  roundCount: number;
}

export interface GameSessionState {
  gameId: string;
  revealedItemIds: string[];
  currentRoundId?: string;
  currentItemId?: string;
  teamScores: Record<string, number>;
  activeTeamId?: string;
  isFinalized: boolean;
}
