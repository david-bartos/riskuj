import type { Game, Question, QuestionCategory, QuestionPoints, Team } from "../types/game";

const demoAudioSrc = "/uploads/demo-placeholder.mp3";
const demoTimestamp = "2026-05-30T00:00:00.000Z";

const questionPoints: QuestionPoints[] = [100, 200, 300, 400, 500];

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

const questions: Question[] = [
    {
      id: "ceske-hity-100",
      categoryId: "ceske-hity",
      points: questionPoints[0],
      prompt: "Který zpěvák nazpíval píseň Lady Carneval?",
      answer: "Karel Gott"
    },
    {
      id: "ceske-hity-200",
      categoryId: "ceske-hity",
      points: questionPoints[1],
      prompt: "Která skupina má hit Slunečný hrob?",
      answer: "Blue Effect",
      moderatorNote: "Uznat lze také název The Blue Effect.",
      audio: {
        id: "audio-ceske-hity-200",
        src: demoAudioSrc,
        title: "Ukázka českého hitu za 200 bodů",
        durationSeconds: 20
      }
    },
    {
      id: "ceske-hity-300",
      categoryId: "ceske-hity",
      points: questionPoints[2],
      prompt: "Jak se jmenuje kapela spojená s písní Malá dáma?",
      answer: "Kabát"
    },
    {
      id: "ceske-hity-400",
      categoryId: "ceske-hity",
      points: questionPoints[3],
      prompt: "Která zpěvačka proslavila píseň Lásko, voníš deštěm?",
      answer: "Marie Rottrová"
    },
    {
      id: "ceske-hity-500",
      categoryId: "ceske-hity",
      points: questionPoints[4],
      prompt: "Která skupina vydala píseň Šrouby do hlavy?",
      answer: "Lucie"
    },
    {
      id: "zahranicni-rock-100",
      categoryId: "zahranicni-rock",
      points: questionPoints[0],
      prompt: "Která kapela nahrála píseň Bohemian Rhapsody?",
      answer: "Queen"
    },
    {
      id: "zahranicni-rock-200",
      categoryId: "zahranicni-rock",
      points: questionPoints[1],
      prompt: "Kdo zpívá skladbu Born to Run?",
      answer: "Bruce Springsteen"
    },
    {
      id: "zahranicni-rock-300",
      categoryId: "zahranicni-rock",
      points: questionPoints[2],
      prompt: "Která skupina má ve znaku blesk a píseň Highway to Hell?",
      answer: "AC/DC",
      audio: {
        id: "audio-zahranicni-rock-300",
        src: demoAudioSrc,
        title: "Ukázka zahraničního rocku za 300 bodů",
        durationSeconds: 18
      }
    },
    {
      id: "zahranicni-rock-400",
      categoryId: "zahranicni-rock",
      points: questionPoints[3],
      prompt: "Kdo byl hlavním zpěvákem skupiny Nirvana?",
      answer: "Kurt Cobain"
    },
    {
      id: "zahranicni-rock-500",
      categoryId: "zahranicni-rock",
      points: questionPoints[4],
      prompt: "Která skupina vydala album The Dark Side of the Moon?",
      answer: "Pink Floyd"
    },
    {
      id: "filmova-hudba-100",
      categoryId: "filmova-hudba",
      points: questionPoints[0],
      prompt: "Kdo složil hlavní motiv filmové série Star Wars?",
      answer: "John Williams"
    },
    {
      id: "filmova-hudba-200",
      categoryId: "filmova-hudba",
      points: questionPoints[1],
      prompt: "Z jakého filmu pochází píseň My Heart Will Go On?",
      answer: "Titanic"
    },
    {
      id: "filmova-hudba-300",
      categoryId: "filmova-hudba",
      points: questionPoints[2],
      prompt: "Který český film proslavil píseň Holubí dům v podání Jiřího Schelingera?",
      answer: "Třicet panen a Pythagoras",
      moderatorNote: "Stačí přesný název filmu."
    },
    {
      id: "filmova-hudba-400",
      categoryId: "filmova-hudba",
      points: questionPoints[3],
      prompt: "Kdo složil hudbu k filmu Pán prstenů: Společenstvo Prstenu?",
      answer: "Howard Shore",
      audio: {
        id: "audio-filmova-hudba-400",
        src: demoAudioSrc,
        title: "Ukázka filmové hudby za 400 bodů",
        durationSeconds: 22
      }
    },
    {
      id: "filmova-hudba-500",
      categoryId: "filmova-hudba",
      points: questionPoints[4],
      prompt: "Který skladatel je autorem hudby k filmu Tenkrát na Západě?",
      answer: "Ennio Morricone"
    },
    {
      id: "devadesatky-100",
      categoryId: "devadesatky",
      points: questionPoints[0],
      prompt: "Která dívčí skupina zpívala hit Wannabe?",
      answer: "Spice Girls"
    },
    {
      id: "devadesatky-200",
      categoryId: "devadesatky",
      points: questionPoints[1],
      prompt: "Která česká skupina vydala píseň František?",
      answer: "Buty"
    },
    {
      id: "devadesatky-300",
      categoryId: "devadesatky",
      points: questionPoints[2],
      prompt: "Kdo zpíval hit ...Baby One More Time?",
      answer: "Britney Spears",
      audio: {
        id: "audio-devadesatky-300",
        src: demoAudioSrc,
        title: "Ukázka devadesátek za 300 bodů",
        durationSeconds: 19
      }
    },
    {
      id: "devadesatky-400",
      categoryId: "devadesatky",
      points: questionPoints[3],
      prompt: "Která kapela měla hit Smells Like Teen Spirit?",
      answer: "Nirvana"
    },
    {
      id: "devadesatky-500",
      categoryId: "devadesatky",
      points: questionPoints[4],
      prompt: "Jak se jmenovalo debutové album skupiny Oasis z roku 1994?",
      answer: "Definitely Maybe"
    },
    {
      id: "poznej-interpreta-100",
      categoryId: "poznej-interpreta",
      points: questionPoints[0],
      prompt: "Poznej interpreta podle nápovědy: slovenský zpěvák, hit Atlantida a výrazný hlas.",
      answer: "Miro Žbirka"
    },
    {
      id: "poznej-interpreta-200",
      categoryId: "poznej-interpreta",
      points: questionPoints[1],
      prompt: "Poznej interpreta podle nápovědy: klavír, brýle a píseň Your Song.",
      answer: "Elton John"
    },
    {
      id: "poznej-interpreta-300",
      categoryId: "poznej-interpreta",
      points: questionPoints[2],
      prompt: "Poznej interpreta podle nápovědy: bílá rukavice, moonwalk a album Thriller.",
      answer: "Michael Jackson",
      audio: {
        id: "audio-poznej-interpreta-300",
        src: demoAudioSrc,
        title: "Ukázka interpreta za 300 bodů",
        durationSeconds: 16
      }
    },
    {
      id: "poznej-interpreta-400",
      categoryId: "poznej-interpreta",
      points: questionPoints[3],
      prompt: "Poznej interpreta podle nápovědy: skupina Pražský výběr a výrazný hlas v písni Pražákům, těm je tu hej.",
      answer: "Michael Kocáb"
    },
    {
      id: "poznej-interpreta-500",
      categoryId: "poznej-interpreta",
      points: questionPoints[4],
      prompt: "Poznej interpreta podle nápovědy: Island, experimentální pop a album Debut.",
      answer: "Björk"
    }
];

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
    },
    {
      id: "round-poslech",
      type: "listening",
      title: "Poslechové kolo",
      categories: [
        { id: "filmove-duety", title: "Filmové duety" },
        { id: "cover-verze", title: "Cover verze" }
      ],
      tracks: [
        {
          id: "poslech-1",
          categoryId: "filmove-duety",
          genreId: "filmove-duety",
          points: questionPoints[0],
          title: "Shallow",
          artist: "Lady Gaga a Bradley Cooper",
          prompt: "Poznejte píseň a film podle ukázky.",
          answer: "Shallow ze Zrodila se hvězda",
          audioUrl: demoAudioSrc,
          audio: {
            id: "audio-poslech-1",
            src: demoAudioSrc,
            title: "Shallow"
          }
        },
        {
          id: "poslech-2",
          categoryId: "cover-verze",
          genreId: "cover-verze",
          points: questionPoints[1],
          title: "Hallelujah",
          artist: "Jeff Buckley",
          prompt: "Poznejte cover verzi podle ukázky.",
          answer: "Hallelujah",
          audioUrl: demoAudioSrc,
          audio: {
            id: "audio-poslech-2",
            src: demoAudioSrc,
            title: "Hallelujah"
          }
        }
      ]
    },
    {
      id: "round-spolecny-jmenovatel",
      type: "common-denominator",
      title: "Společný jmenovatel",
      answer: "Queen",
      clues: [
        { id: "queen-clue-1", order: 1, prompt: "Bohemian Rhapsody", text: "Bohemian Rhapsody" },
        { id: "queen-clue-2", order: 2, prompt: "Freddie Mercury", text: "Freddie Mercury" },
        { id: "queen-clue-3", order: 3, prompt: "We Will Rock You", text: "We Will Rock You" }
      ]
    }
  ],
  createdAt: demoTimestamp,
  updatedAt: demoTimestamp,
  categories,
  questions,
  listeningGenres: [
    { id: "filmove-duety", title: "Filmové duety" },
    { id: "cover-verze", title: "Cover verze" }
  ],
  listeningItems: [
    {
      id: "poslech-1",
      genreId: "filmove-duety",
      title: "Shallow",
      artist: "Lady Gaga a Bradley Cooper",
      prompt: "Poznejte píseň a film podle ukázky.",
      answer: "Shallow ze Zrodila se hvězda",
      audioUrl: demoAudioSrc
    },
    {
      id: "poslech-2",
      genreId: "cover-verze",
      title: "Hallelujah",
      artist: "Jeff Buckley",
      prompt: "Poznejte cover verzi podle ukázky.",
      answer: "Hallelujah",
      audioUrl: demoAudioSrc
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

export { questionPoints as demoQuestionPoints };
