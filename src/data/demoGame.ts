import type { Game, QuestionPoints } from "../types/game";

export const demoQuestionPoints: QuestionPoints[] = [100, 200, 300, 400, 500];

export const demoGame: Game = {
  id: "demo-hudebni-riskuj",
  title: "Hudebni Riskuj",
  categories: [
    { id: "pop", title: "Pop" },
    { id: "rock", title: "Rock" },
    { id: "filmy", title: "Filmy" }
  ],
  questions: [
    {
      id: "pop-100",
      categoryId: "pop",
      points: 100,
      prompt: "Ktera zpevacka proslavila album 1989?",
      answer: "Taylor Swift"
    },
    {
      id: "pop-200",
      categoryId: "pop",
      points: 200,
      prompt: "Kdo nazpival hit Billie Jean?",
      answer: "Michael Jackson"
    },
    {
      id: "rock-100",
      categoryId: "rock",
      points: 100,
      prompt: "Jak se jmenuje zpevak skupiny Queen?",
      answer: "Freddie Mercury"
    },
    {
      id: "filmy-100",
      categoryId: "filmy",
      points: 100,
      prompt: "Ktery film obsahuje pisen My Heart Will Go On?",
      answer: "Titanic"
    }
  ],
  listeningGenres: [
    { id: "filmove-duety", title: "Filmove duety" },
    { id: "cover-verze", title: "Cover verze" }
  ],
  listeningItems: [
    {
      id: "poslech-1",
      genreId: "filmove-duety",
      title: "Shallow",
      artist: "Lady Gaga a Bradley Cooper",
      prompt: "Poznejte pisen a film podle ukazky.",
      answer: "Shallow ze Zrodila se hvezda",
      audioUrl: "/uploads/demo-placeholder.mp3"
    },
    {
      id: "poslech-2",
      genreId: "cover-verze",
      title: "Hallelujah",
      artist: "Jeff Buckley",
      prompt: "Poznejte cover verzi podle ukazky.",
      answer: "Hallelujah",
      audioUrl: "/uploads/demo-placeholder.mp3"
    }
  ],
  commonDenominator: {
    answer: "Queen",
    clues: [
      { id: "queen-clue-1", text: "Bohemian Rhapsody" },
      { id: "queen-clue-2", text: "Freddie Mercury" },
      { id: "queen-clue-3", text: "We Will Rock You" }
    ]
  }
};
