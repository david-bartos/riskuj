export type AudioAsset = {
  id: string;
  src: string;
  title: string;
};

export type Category = {
  id: string;
  title: string;
};

export type Question = {
  id: string;
  categoryId: string;
  points: number;
  prompt: string;
  answer: string;
  audio?: AudioAsset;
};
