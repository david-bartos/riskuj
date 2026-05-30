export type QuestionPoints = 100 | 200 | 300 | 400 | 500;

export interface Team {
  id: string;
  name: string;
}

export interface AudioAsset {
  id: string;
  src: string;
  originalName: string;
  displayName?: string;
  mimeType: "audio/mpeg";
  durationSeconds?: number;
}

export interface Category {
  id: string;
  title: string;
}

export interface BaseRound {
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

export interface QuestionRound extends BaseRound {
  type: "question";
  categories: Category[];
  items: QuestionItem[];
}

export interface ListeningItem {
  id: string;
  points: QuestionPoints;
  prompt: string;
  audio?: AudioAsset;
  trackTitleAnswer: string;
  artistAnswer: string;
  moderatorNote?: string;
}

export interface ListeningRound extends BaseRound {
  type: "listening";
  items: ListeningItem[];
}

export interface CommonDenominatorClue {
  id: string;
  prompt: string;
  audio?: AudioAsset;
  moderatorNote?: string;
}

export interface CommonDenominatorRound extends BaseRound {
  type: "common-denominator";
  points: QuestionPoints;
  clues: CommonDenominatorClue[];
  answer: string;
  moderatorNote?: string;
}

export type Round = QuestionRound | ListeningRound | CommonDenominatorRound;

export interface Game {
  id: string;
  title: string;
  teams: Team[];
  rounds: Round[];
}

export type PresenterPhase = "board" | "prompt" | "answer";

export interface GameSessionState {
  gameId: string;
  selectedRoundId?: string;
  selectedItemId?: string;
  phase: PresenterPhase;
  revealedItemIds: string[];
  revealedClueIds: string[];
  teamScores: Record<string, number>;
  activeTeamId?: string;
  isFinalized: boolean;
}
