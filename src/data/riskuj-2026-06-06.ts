import type {
  CommonDenominatorClue,
  CommonDenominatorItem,
  Game,
  ListeningItem,
  Question,
  QuestionCategory,
  QuestionPoints,
  Team
} from "../types/game";

const timestamp = "2026-05-30T00:00:00.000Z";
const values: QuestionPoints[] = [1000, 3000, 5000, 10000];

const teams: Team[] = Array.from({ length: 6 }, (_, index) => ({
  id: `team-${index + 1}`,
  name: `Tým ${index + 1}`
}));

const categories: QuestionCategory[] = Array.from({ length: 6 }, (_, index) => ({
  id: `hudebni-otazky-${index + 1}`,
  title: `Hudební otázky ${index + 1}`
}));

function createQuestion(category: QuestionCategory, value: QuestionPoints, index: number): Question {
  const questionNumber = index + 1;

  return {
    id: `riskuj-66-q-${String(questionNumber).padStart(2, "0")}`,
    categoryId: category.id,
    value: value as Question["value"],
    points: value,
    prompt: `Doplnit otázku ${questionNumber} podle finálního zadání kamaráda.`,
    answer: "Doplnit správnou odpověď podle finálního zadání.",
    options: [
      { id: "a", label: "A", text: "Doplnit variantu A" },
      { id: "b", label: "B", text: "Doplnit variantu B" },
      { id: "c", label: "C", text: "Doplnit variantu C" },
      { id: "d", label: "D", text: "Doplnit variantu D" }
    ],
    correctOptionId: "a",
    moderatorNote:
      "Obsah otázky není v dostupném kanonickém souboru. Před akcí ověřit s Davidem.",
    reviewStatus: "needs-source"
  };
}

const questions: Question[] = categories.flatMap((category, categoryIndex) =>
  values.map((value, valueIndex) =>
    createQuestion(category, value, categoryIndex * values.length + valueIndex)
  )
);

const listeningGenres = [
  { id: "zanr-pop", title: "Pop" },
  { id: "zanr-rock", title: "Rock" },
  { id: "zanr-hip-hop", title: "Hip hop" },
  { id: "zanr-elektronika", title: "Elektronika" },
  { id: "zanr-ceskoslovensko", title: "Česko/slovensko" }
];

const listeningArtists = [
  "Doplnit interpret 1",
  "Doplnit interpret 2",
  "Doplnit interpret 3",
  "Doplnit interpret 4",
  "Doplnit interpret 5",
  "Doplnit interpret 6",
  "Doplnit interpret 7",
  "Doplnit interpret 8",
  "Doplnit interpret 9",
  "Doplnit interpret 10",
  "Doplnit interpret 11",
  "Doplnit interpret 12",
  "Doplnit interpret 13",
  "Doplnit interpret 14",
  "J.A.R."
];

const listeningItems: ListeningItem[] = listeningArtists.map((artist, index) => {
  const itemNumber = index + 1;
  const genre = listeningGenres[index % listeningGenres.length];
  const isJar = artist === "J.A.R.";
  const trackTitle = isJar ? "" : `Doplnit název skladby ${itemNumber}`;
  const answer = isJar
    ? "J.A.R. - název skladby chybí v zadání"
    : `${artist} - ${trackTitle}`;

  return {
    id: `riskuj-66-listen-${String(itemNumber).padStart(2, "0")}`,
    genreId: genre.id,
    categoryId: genre.id,
    prompt: "Poznej interpreta a název skladby.",
    title: trackTitle || "J.A.R. - doplnit název skladby",
    artist,
    artistAnswer: artist,
    trackTitle,
    trackTitleAnswer: trackTitle,
    answer,
    audioUrl: `/uploads/riskuj-66-listen-${String(itemNumber).padStart(2, "0")}.mp3`,
    audio: {
      id: `riskuj-66-audio-listen-${String(itemNumber).padStart(2, "0")}`,
      src: `/uploads/riskuj-66-listen-${String(itemNumber).padStart(2, "0")}.mp3`,
      title: `MP3 slot pro poslech ${itemNumber}`,
      needsUpload: true,
      mimeType: "audio/mpeg"
    },
    value: 5000,
    points: 5000,
    reviewStatus: "needs-source",
    knownIssueIds: isJar ? ["jar-missing-track-title"] : undefined
  };
});

const commonDenominatorItems: CommonDenominatorItem[] = Array.from(
  { length: 6 },
  (_, index) => {
    const itemNumber = index + 1;
    const clues: CommonDenominatorClue[] = Array.from({ length: 3 }, (_unused, clueIndex) => ({
      id: `riskuj-66-common-${itemNumber}-clue-${clueIndex + 1}`,
      text: `Doplnit indicii ${clueIndex + 1} pro společný jmenovatel ${itemNumber}.`,
      prompt: `Doplnit indicii ${clueIndex + 1} pro společný jmenovatel ${itemNumber}.`,
      order: clueIndex + 1
    }));

    return {
      id: `riskuj-66-common-${itemNumber}`,
      title: `Společný jmenovatel ${itemNumber}`,
      value: 5000,
      clues,
      answer: `Doplnit odpověď ${itemNumber}`,
      hint: "Volitelná nápověda bude doplněna podle finálního zadání.",
      moderatorNote:
        "Finální společný jmenovatel není v dostupném kanonickém souboru. Ověřit s Davidem.",
      reviewStatus: "needs-source"
    };
  }
);

export const riskuj20260606Game: Game = {
  id: "riskuj-2026-06-06",
  title: "Riskuj 6.6",
  teams,
  rounds: [
    {
      id: "round-1-hudebni-otazky",
      type: "question",
      title: "1. kolo: Hudební otázky",
      categories,
      questions,
      items: questions
    },
    {
      id: "round-2-poslechy",
      type: "listening",
      title: "2. kolo: Poslechy",
      genres: listeningGenres,
      categories: listeningGenres,
      tracks: listeningItems,
      items: listeningItems
    },
    {
      id: "round-3-spolecny-jmenovatel",
      type: "common-denominator",
      title: "3. kolo: Společný jmenovatel",
      items: commonDenominatorItems,
      points: 5000,
      answer: commonDenominatorItems[0].answer,
      moderatorNote: commonDenominatorItems[0].moderatorNote,
      clues: commonDenominatorItems[0].clues
    }
  ],
  categories,
  questions,
  listeningGenres,
  listeningItems,
  commonDenominator: {
    answer: commonDenominatorItems[0].answer,
    clues: commonDenominatorItems[0].clues
  },
  knownIssues: [
    {
      id: "source-content-missing",
      severity: "blocking",
      message:
        "Dostupný kanonický Obsidian soubor neobsahuje plné znění 24 otázek, tracklist ani 6 společných jmenovatelů.",
      source:
        "/home/junkett/Obsidian/David/Projekty/Riskuj/2026-05-29 - Zadání od kamaráda pro kvíz 6.6.md"
    },
    {
      id: "listening-count-mismatch",
      severity: "warning",
      message: "Zadání říká 14 tracků, ale dostupný seznam obsahuje 15 položek."
    },
    {
      id: "jar-missing-track-title",
      severity: "warning",
      message: "Položka J.A.R. nemá v zadání uvedený název skladby."
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
};
