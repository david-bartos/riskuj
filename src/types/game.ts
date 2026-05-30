export type GameRoundType = "question" | "listening" | "common-denominator";

export type QuestionPoints = number;

export interface AudioAsset {
  id: string;
  src: string;
  title: string;
  artist?: string;
  durationSeconds?: number;
  originalName?: string;
  displayName?: string;
  mimeType?: "audio/mpeg";
  /** Legacy/admin upload URL alias. */
  url?: string;
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

export interface QuestionItem {
  id: string;
  categoryId: string;
  points: QuestionPoints;
  prompt: string;
  answer: string;
  moderatorNote?: string;
  audio?: AudioAsset;
}

export type Question = QuestionItem;

export interface ListeningCategory {
  id: string;
  title: string;
}

export type ListeningGenre = ListeningCategory;

export interface ListeningItem {
  id: string;
  prompt: string;
  answer: string;
  categoryId?: string;
  points?: QuestionPoints;
  audio?: AudioAsset;
  moderatorNote?: string;
  /** Admin editor compatibility fields. */
  genreId?: string;
  title?: string;
  artist?: string;
  audioUrl?: string;
  /** PR #17 presenter compatibility fields. */
  trackTitleAnswer?: string;
  artistAnswer?: string;
}

export interface CommonDenominatorClue {
  id: string;
  order?: number;
  prompt?: string;
  answer?: string;
  audio?: AudioAsset;
  moderatorNote?: string;
  /** Admin editor compatibility field. */
  text?: string;
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
  /** PR #17 compatibility alias. */
  items?: QuestionItem[];
}

export interface ListeningRound extends BaseRound {
  type: "listening";
  categories: ListeningCategory[];
  tracks: ListeningItem[];
  /** PR #17 compatibility alias. */
  items?: ListeningItem[];
}

export interface CommonDenominatorRound extends BaseRound {
  type: "common-denominator";
  clues: CommonDenominatorClue[];
  answer: string;
  points?: QuestionPoints;
  moderatorNote?: string;
}

export type GameRound = QuestionRound | ListeningRound | CommonDenominatorRound;
export type Round = GameRound;

export interface Game {
  id: string;
  title: string;
  teams: Team[];
  rounds: GameRound[];
  createdAt: string;
  updatedAt: string;
  /** Legacy projection used by the current presenter/admin UI until it is fully migrated to rounds. */
  categories: Category[];
  /** Legacy projection used by the current presenter/admin UI until it is fully migrated to rounds. */
  questions: Question[];
  /** Admin editor compatibility fields for 2./3. kolo. */
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
