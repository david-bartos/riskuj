import type { AudioAsset, Game } from "../types/game";

const audio = (
  id: string,
  fileName: string,
  displayName: string
): AudioAsset => ({
  id,
  src: `/demo-audio/${fileName}`,
  originalName: fileName,
  displayName,
  mimeType: "audio/mpeg"
});

export const demoGame: Game = {
  id: "demo-hudebni-riskuj",
  title: "Hudební Riskuj",
  teams: [
    { id: "team-1", name: "Tým 1" },
    { id: "team-2", name: "Tým 2" },
    { id: "team-3", name: "Tým 3" }
  ],
  rounds: [
    {
      id: "round-question",
      type: "question",
      title: "Klasické otázky",
      categories: [
        { id: "cz-pop", title: "Český pop" },
        { id: "rock", title: "Rock" }
      ],
      items: [
        {
          id: "question-cz-pop-100",
          categoryId: "cz-pop",
          points: 100,
          prompt: "Která zpěvačka nazpívala píseň Malá dáma?",
          answer: "Kabát",
          moderatorNote: "Uznat také odpověď skupina Kabát."
        },
        {
          id: "question-cz-pop-200",
          categoryId: "cz-pop",
          points: 200,
          prompt: "Kdo je autorem písně Jožin z bažin?",
          answer: "Ivan Mládek",
          audio: audio(
            "audio-question-200",
            "demo-question-clue.mp3",
            "Doplňková ukázka"
          )
        },
        {
          id: "question-rock-100",
          categoryId: "rock",
          points: 100,
          prompt: "Jak se jmenuje zpěvák kapely Olympic?",
          answer: "Petr Janda"
        },
        {
          id: "question-rock-200",
          categoryId: "rock",
          points: 200,
          prompt: "Ze které země pochází skupina Queen?",
          answer: "Velká Británie"
        }
      ]
    },
    {
      id: "round-listening",
      type: "listening",
      title: "Hudební ukázky",
      items: [
        {
          id: "listening-100",
          points: 100,
          prompt: "Poznej interpreta a název skladby z ukázky.",
          audio: audio(
            "audio-listening-100",
            "demo-placeholder-1.mp3",
            "Hudební ukázka 1"
          ),
          trackTitleAnswer: "Bohemian Rhapsody",
          artistAnswer: "Queen",
          moderatorNote: "Stačí přesný interpret a rozpoznatelný název."
        },
        {
          id: "listening-200",
          points: 200,
          prompt: "Poznej interpreta a název české písně.",
          audio: audio(
            "audio-listening-200",
            "demo-placeholder-2.mp3",
            "Hudební ukázka 2"
          ),
          trackTitleAnswer: "Jožin z bažin",
          artistAnswer: "Ivan Mládek"
        }
      ]
    },
    {
      id: "round-common",
      type: "common-denominator",
      title: "Společný jmenovatel",
      points: 300,
      answer: "Písně se zvířetem v názvu",
      moderatorNote: "Odpověď odhalit až po všech indiciích nebo po tipu týmu.",
      clues: [
        {
          id: "common-clue-1",
          prompt: "Indicie: bažina a český humor.",
          audio: audio(
            "audio-common-1",
            "demo-common-clue.mp3",
            "Indicie 1"
          )
        },
        {
          id: "common-clue-2",
          prompt: "Indicie: rocková skladba s výrazným refrénem."
        },
        {
          id: "common-clue-3",
          prompt: "Indicie: v názvu každé odpovědi se skrývá zvíře."
        }
      ]
    }
  ]
};
