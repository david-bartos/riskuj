import type { Game, QuestionCategory, QuestionItem, Team } from "../types/game";

const points = [100, 200, 300, 400, 500];
const demoTimestamp = "2026-05-30T00:00:00.000Z";

const demoTeams: Team[] = [
  { id: "team-1", name: "Tým 1", color: "#d62828" },
  { id: "team-2", name: "Tým 2", color: "#f77f00" },
  { id: "team-3", name: "Tým 3", color: "#fcbf49" },
  { id: "team-4", name: "Tým 4", color: "#2a9d8f" },
  { id: "team-5", name: "Tým 5", color: "#457b9d" },
  { id: "team-6", name: "Tým 6", color: "#6d597a" }
];

const categories: QuestionCategory[] = [
  { id: "ceske-hity", title: "České hity" },
  { id: "zahranicni-rock", title: "Zahraniční rock" },
  { id: "filmova-hudba", title: "Filmová hudba" },
  { id: "devadesatky", title: "Devadesátky" },
  { id: "poznej-interpreta", title: "Poznej interpreta" }
];

const questionMatrix: Array<Array<Omit<QuestionItem, "id" | "categoryId" | "points">>> = [
  [
    { prompt: "Který zpěvák proslavil píseň Lady Karneval?", answer: "Karel Gott" },
    { prompt: "Jak se jmenuje kapela kolem Michala Malátného?", answer: "Chinaski" },
    { prompt: "Kdo nazpíval hit Malá dáma?", answer: "Kabát" },
    { prompt: "Která česká zpěvačka zpívá píseň Láska je láska?", answer: "Lucie Bílá" },
    { prompt: "Která skupina vydala album Slunečnice?", answer: "Lucie" }
  ],
  [
    { prompt: "Kdo je frontmanem skupiny U2?", answer: "Bono" },
    { prompt: "Která kapela nahrála Smoke on the Water?", answer: "Deep Purple" },
    { prompt: "Jak se jmenoval zpěvák skupiny Queen?", answer: "Freddie Mercury" },
    { prompt: "Která skupina vydala album Nevermind?", answer: "Nirvana" },
    { prompt: "Kdo hrál hlavní kytarový riff v Sweet Child O' Mine?", answer: "Slash" }
  ],
  [
    { prompt: "Který skladatel je spojený s hudbou k filmu Titanic?", answer: "James Horner" },
    { prompt: "Jaká píseň zazní ve filmu Bodyguard od Whitney Houston?", answer: "I Will Always Love You" },
    { prompt: "Kdo složil hlavní motiv Star Wars?", answer: "John Williams" },
    { prompt: "Ve kterém filmu zazní píseň Eye of the Tiger?", answer: "Rocky III" },
    { prompt: "Který animovaný film proslavil píseň Let It Go?", answer: "Ledové království" }
  ],
  [
    { prompt: "Která skupina zpívala Wonderwall?", answer: "Oasis" },
    { prompt: "Kdo vydal hit ...Baby One More Time?", answer: "Britney Spears" },
    { prompt: "Který rapper proslavil skladbu Gangsta's Paradise?", answer: "Coolio" },
    { prompt: "Která dívčí skupina měla hit Wannabe?", answer: "Spice Girls" },
    { prompt: "Kdo zpíval český hit Dlouhá noc?", answer: "Helena Vondráčková" }
  ],
  [
    {
      prompt: "Poznej interpreta podle ukázky.",
      answer: "Karel Gott",
      audio: { id: "audio-karel-gott", src: "/uploads/karel-gott.mp3", title: "Ukázka 1" }
    },
    {
      prompt: "Poznej interpreta podle ukázky.",
      answer: "Queen",
      audio: { id: "audio-queen", src: "/uploads/queen.mp3", title: "Ukázka 2" }
    },
    {
      prompt: "Poznej interpreta podle ukázky.",
      answer: "Lucie",
      audio: { id: "audio-lucie", src: "/uploads/lucie.mp3", title: "Ukázka 3" }
    },
    {
      prompt: "Poznej interpreta podle ukázky.",
      answer: "Nirvana",
      audio: { id: "audio-nirvana", src: "/uploads/nirvana.mp3", title: "Ukázka 4" }
    },
    {
      prompt: "Poznej interpreta podle ukázky.",
      answer: "Spice Girls",
      audio: { id: "audio-spice-girls", src: "/uploads/spice-girls.mp3", title: "Ukázka 5" }
    }
  ]
];

const questions: QuestionItem[] = categories.flatMap((category, categoryIndex) =>
  points.map((pointValue, pointIndex) => ({
    id: `${category.id}-${pointValue}`,
    categoryId: category.id,
    points: pointValue,
    ...questionMatrix[categoryIndex][pointIndex]
  }))
);

export const demoGame: Game = {
  id: "demo-hudebni-riskuj",
  title: "Hudební Riskuj",
  teams: demoTeams,
  rounds: [
    {
      id: "round-otazky",
      type: "question",
      title: "Riskuj",
      categories,
      questions
    }
  ],
  createdAt: demoTimestamp,
  updatedAt: demoTimestamp
};

export { points as demoQuestionPoints };
