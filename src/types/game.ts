export type MoneyValue = 0 | 1000 | 3000 | 5000 | 10000;
export type RoundType = "question" | "listening" | "common-denominator";
export type GameRoundType = RoundType;
export type QuestionPoints = number;

export interface AudioAsset {
  id: string;
  src: string;
  title: string;
  fileName?: string;
  mimeType?: string;
  durationSeconds?: number;
  /** Existing admin/upload compatibility fields. */
  originalName?: string;
  displayName?: string;
  url?: string;
  artist?: string;
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

export type Category = QuestionCategory;
export type ListeningCategory = QuestionCategory;
export type ListeningGenre = QuestionCategory;

export interface QuestionItem {
  id: string;
  categoryId: string;
  value?: Exclude<MoneyValue, 0>;
  points: QuestionPoints;
  prompt: string;
  answer: string;
  moderatorNote?: string;
  audio?: AudioAsset;
}

export type Question = QuestionItem;

export interface ListeningItem {
  id: string;
  genreId?: string;
  prompt: string;
  artist?: string;
  trackTitle?: string;
  audio?: AudioAsset;
  /** Existing admin/presenter compatibility fields. */
  answer: string;
  categoryId?: string;
  points?: QuestionPoints;
  value?: Exclude<MoneyValue, 0>;
  moderatorNote?: string;
  title?: string;
  audioUrl?: string;
  trackTitleAnswer?: string;
  artistAnswer?: string;
}

export interface CommonDenominatorClue {
  id: string;
  text?: string;
  audio?: AudioAsset;
  /** Existing admin compatibility fields. */
  order?: number;
  prompt?: string;
  answer?: string;
  moderatorNote?: string;
}

export interface CommonDenominatorItem {
  id: string;
  title: string;
  clues: CommonDenominatorClue[];
  answer: string;
  value: Exclude<MoneyValue, 0>;
  hint?: string;
  moderatorNote?: string;
}

export interface BaseRound {
  id: string;
  title: string;
  type: RoundType;
}

export interface QuestionRound extends BaseRound {
  type: "question";
  categories: QuestionCategory[];
  /** Legacy compatibility alias. */
  questions: QuestionItem[];
  items?: QuestionItem[];
}

export interface ListeningRound extends BaseRound {
  type: "listening";
  genres?: QuestionCategory[];
  items?: ListeningItem[];
  /** Legacy compatibility aliases. */
  categories: ListeningCategory[];
  tracks: ListeningItem[];
}

export interface CommonDenominatorRound extends BaseRound {
  type: "common-denominator";
  items?: CommonDenominatorItem[];
  /** Legacy one-question projection used by the current admin/editor. */
  clues: CommonDenominatorClue[];
  answer: string;
  points?: QuestionPoints;
  moderatorNote?: string;
}

export type Round = QuestionRound | ListeningRound | CommonDenominatorRound;
export type GameRound = Round;

export interface Game {
  id: string;
  title: string;
  teams: Team[];
  rounds: Round[];
  /** Existing persistence/editor metadata. */
  createdAt: string;
  updatedAt: string;
  /** Legacy projection used by editor modules until they fully migrate to rounds. */
  categories: Category[];
  questions: Question[];
  listeningGenres?: ListeningGenre[];
  listeningItems?: ListeningItem[];
  commonDenominator?: {
    answer: string;
    clues: CommonDenominatorClue[];
  };
}

export interface GameSummary {
  id: string;
  title: string;
  updatedAt: string;
  roundCount: number;
}

export interface GameSessionState {
  gameId: string;
  revealedQuestionIds: string[];
  currentQuestionId?: string;
  revealedItemIds?: string[];
  currentRoundId?: string;
  currentItemId?: string;
  teamScores: Record<string, number>;
  activeTeamId?: string;
  isFinished: boolean;
  isFinalized?: boolean;
}

export const listeningScoreOptions = [
  { id: "none", label: "0 Kč", value: 0 },
  { id: "artist", label: "Interpret", value: 1000 },
  { id: "track", label: "Track", value: 3000 },
  { id: "both", label: "Obojí", value: 5000 }
] as const;
