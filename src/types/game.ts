export type QuestionPoints = 100 | 200 | 300 | 400 | 500;

export interface AudioAsset {
  id: string;
  src: string;
  title: string;
  durationSeconds?: number;
}

export interface Question {
  id: string;
  categoryId: string;
  points: QuestionPoints;
  prompt: string;
  answer: string;
  moderatorNote?: string;
  audio?: AudioAsset;
}

export interface Category {
  id: string;
  title: string;
}

export interface Game {
  id: string;
  title: string;
  categories: Category[];
  questions: Question[];
}

export interface GameSessionState {
  gameId: string;
  revealedQuestionIds: string[];
  currentQuestionId?: string;
  teamScores: Record<string, number>;
  activeTeamId?: string;
  isFinished: boolean;
}
