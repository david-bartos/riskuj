export type QuestionPoints = 100 | 200 | 300 | 400 | 500;

export type Category = {
  id: string;
  title: string;
};

export type Question = {
  id: string;
  categoryId: string;
  points: QuestionPoints;
  prompt: string;
  answer: string;
};

export type Game = {
  id: string;
  title: string;
  categories: Category[];
  questions: Question[];
};
