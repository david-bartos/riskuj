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

const categories: QuestionCategory[] = [
  { id: "hudebni-otazky-1", title: "Hudební otázky 1" },
  { id: "hudebni-otazky-2", title: "Hudební otázky 2" },
  { id: "hudebni-otazky-3", title: "Hudební otázky 3" },
  { id: "hudebni-otazky-4", title: "Hudební otázky 4" },
  { id: "hudebni-otazky-5", title: "Hudební otázky 5" },
  { id: "hudebni-otazky-6", title: "Hudební otázky 6" }
];

type QuestionSeed = {
  prompt: string;
  answer: string;
  moderatorNote?: string;
  options?: Array<{ id: string; label: string; text: string }>;
  correctOptionId?: string;
};

const questionsByValue: Record<number, QuestionSeed[]> = {
  1000: [
    {
      prompt: "Legendární panák B 52 je pojmenován podle čeho?",
      answer:
        "Podle legendární kapely The B-52s; podle zadání ho vymyslel barman, velký fanoušek kapely.",
      options: [
        { id: "a", label: "A", text: "podle kapely" },
        { id: "b", label: "B", text: "podle bombardéru" }
      ],
      correctOptionId: "a"
    },
    {
      prompt: "Zpěvačka Aurora pochází odkud?",
      answer: "Norsko.",
      options: [
        { id: "a", label: "A", text: "Norsko" },
        { id: "b", label: "B", text: "Švédsko" }
      ],
      correctOptionId: "a"
    },
    {
      prompt: "Basák Flea je členem kapely Red Hot Chili Peppers. ANO/NE?",
      answer: "ANO. Flea je baskytarista Red Hot Chili Peppers.",
      options: [
        { id: "a", label: "ANO", text: "ANO" },
        { id: "b", label: "NE", text: "NE" }
      ],
      correctOptionId: "a"
    },
    {
      prompt: "J.A.R. je Jednotkou akademického rapu. ANO/NE?",
      answer: "ANO.",
      options: [
        { id: "a", label: "ANO", text: "ANO" },
        { id: "b", label: "NE", text: "NE" }
      ],
      correctOptionId: "a"
    },
    {
      prompt: "Kdo zpívá hit Láska je láska?",
      answer: "Lucie Bílá."
    },
    {
      prompt: "Která zpěvačka byla nejposlouchanější na Spotify v letech 2024 a 2025?",
      answer: "Taylor Swift."
    }
  ],
  3000: [
    {
      prompt: "Kdo není gay?",
      answer: "Sting.",
      options: [
        { id: "a", label: "A", text: "Sam Smith" },
        { id: "b", label: "B", text: "Elton John" },
        { id: "c", label: "C", text: "Sting" },
        { id: "d", label: "D", text: "Ricky Martin" }
      ],
      correctOptionId: "c"
    },
    {
      prompt: "Který jazzový fenomén zahraje na jakoukoliv trubku, včetně té od záchodu?",
      answer: "Jiří Stivín."
    },
    {
      prompt:
        "Slavný Ital, hudební skladatel a autor hudby k westernu Tenkrát na západě se jmenuje jak?",
      answer: "Ennio Morricone."
    },
    {
      prompt: "Kdo není z Francie?",
      answer: "Stromae — je z Belgie.",
      options: [
        { id: "a", label: "A", text: "ZAZ" },
        { id: "b", label: "B", text: "Justice" },
        { id: "c", label: "C", text: "Stromae" },
        { id: "d", label: "D", text: "Caravan Palace" }
      ],
      correctOptionId: "c"
    },
    {
      prompt: "Dvořák nebo Smetana? Přiřaď: Rusalka, Má vlast, Dalibor, Novosvětská.",
      answer: "Dvořák: Rusalka a Novosvětská. Smetana: Má vlast a Dalibor.",
      moderatorNote: "Uznat kompletní správné přiřazení."
    },
    {
      prompt: "Od kterého roku se pořádá festival Colours of Ostrava? Tolerance 3 roky.",
      answer: "Od roku 2002.",
      moderatorNote: "Tolerance ±3 roky."
    }
  ],
  5000: [
    {
      prompt: "Odkud pochází legendární kapela Yello?",
      answer: "Švýcarsko.",
      options: [
        { id: "a", label: "A", text: "Velká Británie" },
        { id: "b", label: "B", text: "Švédsko" },
        { id: "c", label: "C", text: "Švýcarsko" },
        { id: "d", label: "D", text: "Holandsko" }
      ],
      correctOptionId: "c"
    },
    {
      prompt: "V jakém roce byla založena kapela U2?",
      answer: "1976.",
      options: [
        { id: "a", label: "A", text: "1979" },
        { id: "b", label: "B", text: "1981" },
        { id: "c", label: "C", text: "1985" },
        { id: "d", label: "D", text: "1976" }
      ],
      correctOptionId: "d"
    },
    {
      prompt: "Losing My Religion je hit které kapely?",
      answer: "R.E.M.",
      options: [
        { id: "a", label: "A", text: "R.E.M." },
        { id: "b", label: "B", text: "WHAM" },
        { id: "c", label: "C", text: "Cream" },
        { id: "d", label: "D", text: "The Jam" }
      ],
      correctOptionId: "a"
    },
    {
      prompt:
        "Přiřaď interpreta ke kapele: 1/Vladimir 518, 2/Petr Marek, 3/David Doubek, 4/Petr Fiala. Kapely: a/PSH, b/Ventolin, c/Midi Lidi, d/Mňága a Žďorp.",
      answer: "1a, 2c, 3b, 4d."
    },
    {
      prompt: "Doplň text písničky: Marx, Engels…",
      answer: "Beatles — z hitu kapely Vltava."
    },
    {
      prompt:
        "Přiřaď dílo k autorovi: 1/Richard Wagner, 2/W. A. Mozart, 3/Antonín Dvořák, 4/Ludwig van Beethoven. Díla: a/Slovanské tance, b/Prsten Nibelungův, c/Figarova svatba, d/Pro Elišku.",
      answer: "1b, 2c, 3a, 4d."
    }
  ],
  10000: [
    {
      prompt:
        "Který světoznámý režisér a výtvarník byl Peterem Gabrielem požádán o spolupráci na legendárním klipu Sledgehammer?",
      answer: "Jan Švankmajer."
    },
    {
      prompt: "Odkud pochází zpěvačka Rihanna?",
      answer: "Barbados.",
      options: [
        { id: "a", label: "A", text: "Barbados" },
        { id: "b", label: "B", text: "Filipíny" },
        { id: "c", label: "C", text: "Kostarika" },
        { id: "d", label: "D", text: "Srí Lanka" }
      ],
      correctOptionId: "a"
    },
    {
      prompt: "Kdo/co nepatří: Nile Rodgers, Daft Punk, Sex Pistols, Get Lucky?",
      answer: "Sex Pistols. Nile Rodgers, Daft Punk a Get Lucky patří k jednomu hudebnímu kontextu.",
      options: [
        { id: "a", label: "A", text: "Nile Rodgers" },
        { id: "b", label: "B", text: "Daft Punk" },
        { id: "c", label: "C", text: "Sex Pistols" },
        { id: "d", label: "D", text: "Get Lucky" }
      ],
      correctOptionId: "c"
    },
    {
      prompt: "Vyjmenuj alespoň 3 členy tzv. Klubu 27. Malá nápověda: všichni zemřeli ve 27 letech.",
      answer:
        "Např. Amy Winehouse, Jim Morrison, Jimi Hendrix, Kurt Cobain, Janis Joplin, Brian Jones.",
      moderatorNote: "Uznat libovolné alespoň 3 správné členy Klubu 27."
    },
    {
      prompt: "Která píseň nepatří do repertoáru Radůzy?",
      answer: "Bůh má problém.",
      options: [
        { id: "a", label: "A", text: "Na koníčka vyskočím" },
        { id: "b", label: "B", text: "Bůh má problém" },
        { id: "c", label: "C", text: "Nebe, peklo, ráj" },
        { id: "d", label: "D", text: "De Nîmes" }
      ],
      correctOptionId: "b"
    },
    {
      prompt:
        "Přiřaď stát k interpretovi: 1/The Weeknd, 2/Prince, 3/OKA, 4/MØ. Státy: a/USA, b/Kanada, c/Dánsko, d/Austrálie.",
      answer: "1b, 2a, 3d, 4c."
    }
  ]
};

function createQuestion(
  category: QuestionCategory,
  value: QuestionPoints,
  questionIndex: number,
  categoryIndex: number
): Question {
  const questionNumber = questionIndex + 1;
  const seed = questionsByValue[value][categoryIndex];

  return {
    id: `riskuj-66-q-${String(questionNumber).padStart(2, "0")}`,
    categoryId: category.id,
    value: value as Question["value"],
    points: value,
    prompt: seed.prompt,
    answer: seed.answer,
    options: seed.options,
    correctOptionId: seed.correctOptionId,
    moderatorNote: seed.moderatorNote ?? "Zadání převzato z dodaného briefu pro kvíz 6.6.",
    reviewStatus: "ready"
  };
}

const questions: Question[] = categories.flatMap((category, categoryIndex) =>
  values.map((value, valueIndex) =>
    createQuestion(category, value, categoryIndex * values.length + valueIndex, categoryIndex)
  )
);

const listeningGenres = [
  { id: "zanr-80-90-leta", title: "80. a 90. léta" },
  { id: "zanr-cz-sk-hity", title: "CZ a SK hity" },
  { id: "zanr-pop", title: "Pop" },
  { id: "zanr-elektronika", title: "Elektronika" },
  { id: "zanr-folk-country", title: "Folk / country" },
  { id: "zanr-rock", title: "Rock" },
  { id: "zanr-reggae-funky-hiphop", title: "Reggae / funky / hip hop" }
];

type ListeningSeed = {
  genreId: string;
  artist: string;
  trackTitle: string;
  knownIssueIds?: string[];
  reviewStatus?: "ready" | "needs-review";
};

const listeningSeeds: ListeningSeed[] = [
  { genreId: "zanr-80-90-leta", artist: "Kate Bush", trackTitle: "Running Up That Hill" },
  { genreId: "zanr-80-90-leta", artist: "Moby", trackTitle: "Honey" },
  { genreId: "zanr-cz-sk-hity", artist: "Team", trackTitle: "Reklama na ticho" },
  { genreId: "zanr-cz-sk-hity", artist: "Midi Lidi", trackTitle: "Rád vařim" },
  { genreId: "zanr-pop", artist: "Katy Perry", trackTitle: "Hot n Cold" },
  { genreId: "zanr-pop", artist: "Michael Jackson", trackTitle: "Jam" },
  { genreId: "zanr-elektronika", artist: "The Chemical Brothers", trackTitle: "Do It Again" },
  { genreId: "zanr-elektronika", artist: "Klangkarussell", trackTitle: "Sonnentanz (Sun Don’t Shine)" },
  { genreId: "zanr-folk-country", artist: "Johnny Cash", trackTitle: "Personal Jesus" },
  { genreId: "zanr-folk-country", artist: "Žalman a spol.", trackTitle: "Rána v trávě" },
  { genreId: "zanr-rock", artist: "Led Zeppelin", trackTitle: "Good Times Bad Times" },
  { genreId: "zanr-rock", artist: "Ozzy Osbourne", trackTitle: "Perry Mason" },
  { genreId: "zanr-reggae-funky-hiphop", artist: "Cypress Hill", trackTitle: "Tequila Sunrise" },
  {
    genreId: "zanr-reggae-funky-hiphop",
    artist: "J.A.R.",
    trackTitle: "",
    knownIssueIds: ["jar-missing-track-title"],
    reviewStatus: "needs-review"
  },
  { genreId: "zanr-reggae-funky-hiphop", artist: "Bob Marley", trackTitle: "Iron Lion Zion" }
];

const listeningItems: ListeningItem[] = listeningSeeds.map((seed, index) => {
  const itemNumber = index + 1;
  const padded = String(itemNumber).padStart(2, "0");
  const displayTitle = seed.trackTitle || "J.A.R. - doplnit název skladby";
  const answer = seed.trackTitle
    ? `${seed.artist} - ${seed.trackTitle}`
    : "J.A.R. - název skladby chybí v zadání";

  return {
    id: `riskuj-66-listen-${padded}`,
    genreId: seed.genreId,
    categoryId: seed.genreId,
    prompt:
      "Poznej interpreta a název skladby. Interpret = 1 000 Kč, název tracku = 3 000 Kč, obojí = 5 000 Kč.",
    title: displayTitle,
    artist: seed.artist,
    artistAnswer: seed.artist,
    trackTitle: seed.trackTitle,
    trackTitleAnswer: seed.trackTitle,
    answer,
    audioUrl: `/uploads/riskuj-66-listen-${padded}.mp3`,
    audio: {
      id: `riskuj-66-audio-listen-${padded}`,
      src: `/uploads/riskuj-66-listen-${padded}.mp3`,
      title: `MP3 slot: ${answer}`,
      needsUpload: true,
      mimeType: "audio/mpeg"
    },
    value: 5000,
    points: 5000,
    moderatorNote:
      "Všechny týmy hádají současně. Bodování: interpret 1 000 Kč, track 3 000 Kč, obojí 5 000 Kč.",
    reviewStatus: seed.reviewStatus ?? "ready",
    knownIssueIds: seed.knownIssueIds
  };
});

type CommonSeed = {
  answer: string;
  title: string;
  clues: string[];
  explanation: string;
};

const commonSeeds: CommonSeed[] = [
  {
    answer: "HUMAN",
    title: "Společný jmenovatel: Human",
    clues: ["Bruce Springsteen", "The Killers", "Rag’n’Bone Man"],
    explanation: "Všichni mají track s Human v názvu."
  },
  {
    answer: "PEOPLE",
    title: "Společný jmenovatel: People",
    clues: ["Depeche Mode", "The Doors", "LP"],
    explanation: "Všichni mají track s People v názvu."
  },
  {
    answer: "PETR",
    title: "Společný jmenovatel: Petr",
    clues: ["Gabriel — sólový zpěvák", "Muk — sólový zpěvák", "Marek — člen kapely Midi Lidi"],
    explanation: "Všichni mají křestní jméno Petr."
  },
  {
    answer: "DAVID",
    title: "Společný jmenovatel: David",
    clues: ["Guetta", "Bowie", "Koller"],
    explanation: "Všichni mají křestní jméno David."
  },
  {
    answer: "AUSTRÁLIE",
    title: "Společný jmenovatel: Austrálie",
    clues: ["AC/DC", "Kylie Minogue", "Midnight Oil"],
    explanation: "Všichni interpreti jsou z Austrálie."
  },
  {
    answer: "KANADA",
    title: "Společný jmenovatel: Kanada",
    clues: ["Bryan Adams", "Céline Dion", "Alanis Morissette"],
    explanation: "Všichni interpreti jsou z Kanady."
  }
];

const commonDenominatorItems: CommonDenominatorItem[] = commonSeeds.map((seed, index) => {
  const itemNumber = index + 1;
  const clues: CommonDenominatorClue[] = seed.clues.map((clue, clueIndex) => ({
    id: `riskuj-66-common-${itemNumber}-clue-${clueIndex + 1}`,
    text: clue,
    prompt: clue,
    order: clueIndex + 1
  }));

  return {
    id: `riskuj-66-common-${itemNumber}`,
    title: seed.title,
    value: 5000,
    clues,
    answer: seed.answer,
    hint: "Případně pustit tracky nebo napovědět interpreta podle moderátorského uvážení.",
    explanation: seed.explanation,
    moderatorNote: seed.explanation,
    reviewStatus: "ready"
  };
});

export const riskuj20260606Game: Game = {
  id: "riskuj-2026-06-06",
  title: "Riskuj 6.6",
  teams,
  rounds: [
    {
      id: "round-1-hudebni-otazky",
      type: "question",
      title: "1. kolo: Random hudební otázky",
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
      id: "listening-count-mismatch",
      severity: "warning",
      message: "Zadání říká 14 tracků, ale dodaný seznam obsahuje 15 položek."
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
