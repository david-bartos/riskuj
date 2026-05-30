import type {
  CommonDenominatorItem,
  Game,
  ListeningItem,
  Question,
  QuestionCategory,
  QuestionPoints,
  Team
} from "../types/game";

const demoTimestamp = "2026-05-30T00:00:00.000Z";
const questionValues: QuestionPoints[] = [1000, 3000, 5000, 10000];

const demoTeams: Team[] = Array.from({ length: 6 }, (_, index) => ({
  id: `team-${index + 1}`,
  name: `Tým ${index + 1}`
}));

const categories: QuestionCategory[] = [
  { id: "ceske-hity", title: "České hity" },
  { id: "rock", title: "Rock" },
  { id: "film", title: "Film" },
  { id: "devadesatky", title: "Devadesátky" }
];

const questions: Question[] = [
  {
    id: "q-ivan-mladek",
    categoryId: "ceske-hity",
    value: 1000,
    points: 1000,
    prompt: "Který zpěvák proslavil píseň Jožin z bažin?",
    answer: "Ivan Mládek",
    moderatorNote: "Uznat i kapelu Banjo Band."
  },
  {
    id: "q-blue-effect",
    categoryId: "ceske-hity",
    value: 3000,
    points: 3000,
    prompt: "Která skupina zpívá píseň Slunečný hrob?",
    answer: "Blue Effect"
  },
  {
    id: "q-star-wars",
    categoryId: "film",
    value: 5000,
    points: 5000,
    prompt: "Který skladatel složil hlavní motiv k filmu Star Wars?",
    answer: "John Williams"
  },
  {
    id: "q-nevermind",
    categoryId: "rock",
    value: 10000,
    points: 10000,
    prompt: "Která skupina vydala album Nevermind?",
    answer: "Nirvana"
  }
];

const listeningGenres = [
  { id: "cz-pop", title: "CZ pop" },
  { id: "rock", title: "Rock" }
];

const listeningItems: ListeningItem[] = [
  {
    id: "listen-dusilova",
    genreId: "cz-pop",
    categoryId: "cz-pop",
    prompt: "Poznej interpreta a název skladby.",
    artist: "Lenka Dusilová",
    artistAnswer: "Lenka Dusilová",
    trackTitle: "Pro Tebe",
    trackTitleAnswer: "Pro Tebe",
    title: "Ukázka 1",
    answer: "Lenka Dusilová - Pro Tebe",
    value: 5000,
    points: 5000,
    audioUrl: "/uploads/demo-placeholder.mp3",
    audio: {
      id: "audio-listen-dusilova",
      src: "/uploads/demo-placeholder.mp3",
      title: "Ukázka poslechu",
      fileName: "demo-placeholder.mp3",
      mimeType: "audio/mpeg"
    }
  }
];

const commonDenominatorItems: CommonDenominatorItem[] = [
  {
    id: "cd-voda",
    title: "Společný jmenovatel 1",
    value: 5000,
    answer: "Voda",
    hint: "Může jít o motiv v názvu nebo textu.",
    clues: [
      { id: "cd-voda-1", text: "Modlitba pro Martu", prompt: "Modlitba pro Martu", order: 1 },
      { id: "cd-voda-2", text: "Vltava", prompt: "Vltava", order: 2 },
      {
        id: "cd-voda-3",
        text: "Voda, čo ma drží nad vodou",
        prompt: "Voda, čo ma drží nad vodou",
        order: 3
      }
    ]
  }
];

export const demoGame: Game = {
  id: "demo-hudebni-riskuj",
  title: "Hudební RISKuj!",
  teams: demoTeams,
  rounds: [
    {
      id: "round-1",
      type: "question",
      title: "1. kolo: Otázky",
      categories,
      items: questions,
      questions
    },
    {
      id: "round-2",
      type: "listening",
      title: "2. kolo: Poslechy",
      genres: listeningGenres,
      categories: listeningGenres,
      items: listeningItems,
      tracks: listeningItems
    },
    {
      id: "round-3",
      type: "common-denominator",
      title: "3. kolo: Společný jmenovatel",
      items: commonDenominatorItems,
      points: 5000,
      answer: commonDenominatorItems[0].answer,
      clues: commonDenominatorItems[0].clues
    }
  ],
  createdAt: demoTimestamp,
  updatedAt: demoTimestamp,
  categories,
  questions,
  listeningGenres,
  listeningItems,
  commonDenominator: {
    answer: commonDenominatorItems[0].answer,
    clues: commonDenominatorItems[0].clues
  }
};

export { questionValues as demoQuestionPoints };
