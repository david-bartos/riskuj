export type QuestionPoints = 100 | 200 | 300 | 400 | 500;

export interface AudioAsset {
  id: string;
  title: string;
  url: string;
}

export interface Question {
  id: string;
  categoryId: string;
  points: QuestionPoints;
  prompt: string;
  answer: string;
  audio?: AudioAsset;
  moderatorNote?: string;
}

export interface Category {
  id: string;
  title: string;
}

export interface ListeningGenre {
  id: string;
  title: string;
}

export interface ListeningItem {
  id: string;
  genreId: string;
  title: string;
  artist: string;
  prompt: string;
  answer: string;
  audioUrl?: string;
  moderatorNote?: string;
}

export interface CommonDenominatorClue {
  id: string;
  text: string;
}

export interface CommonDenominatorRound {
  answer: string;
  clues: CommonDenominatorClue[];
}

export interface Game {
  id: string;
  title: string;
  categories: Category[];
  questions: Question[];
  listeningGenres: ListeningGenre[];
  listeningItems: ListeningItem[];
  commonDenominator: CommonDenominatorRound;
}

export interface GameSessionState {
  gameId: string;
  revealedQuestionIds: string[];
  activeQuestionId?: string;
}
