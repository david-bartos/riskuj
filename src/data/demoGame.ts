import type { Game, QuestionPoints } from "../types/game";

const categories = [
  { id: "ceske-hity", title: "České hity" },
  { id: "filmove-pisne", title: "Filmové písně" },
  { id: "devadesatky", title: "Devadesátky" },
  { id: "kapely", title: "Kapely" },
  { id: "texty", title: "Texty" }
];

const pointRows: QuestionPoints[] = [100, 200, 300, 400, 500];

const promptsByCategory: Record<string, string[]> = {
  "ceske-hity": [
    "Který zpěvák nazpíval píseň Lady Carneval?",
    "Kdo stojí za hitem Slunečný hrob?",
    "Která zpěvačka proslavila píseň Maluj zase obrázky?",
    "Kdo zpívá skladbu Jasná zpráva?",
    "Která kapela má píseň Dávám ti jeden den?"
  ],
  "filmove-pisne": [
    "Ve kterém filmu zazněla píseň Není nutno?",
    "Která pohádka má píseň Pramen zdraví z Posázaví?",
    "Kdo zpíval titulní píseň k filmu Rebelové?",
    "Který film připomíná píseň Šíleně smutná princezna?",
    "Který skladatel je spojený s hudbou k filmu Kolja?"
  ],
  devadesatky: [
    "Která skupina zpívala hit Nonstop?",
    "Kdo vydal album Medulienka?",
    "Která zpěvačka měla hit Zamilovaná?",
    "Jak se jmenovalo duo s hitem Máma?",
    "Která kapela proslavila píseň František?"
  ],
  kapely: [
    "Která kapela má frontmana Michala Malátného?",
    "Kdo nahrál píseň Colorado?",
    "Která skupina je spojená s albem Černý kočky mokrý žáby?",
    "Kdo zpívá píseň Pohoda?",
    "Která kapela stojí za skladbou Proměny?"
  ],
  texty: [
    "Doplň text: Holky z naší školky...",
    "Doplň text: Severní vítr je...",
    "Doplň text: Statistika nuda je...",
    "Doplň text: Jednou budem dál...",
    "Doplň text: Až mě andělé..."
  ]
};

export const demoGame: Game = {
  id: "demo-hudebni-riskuj",
  title: "Hudební Riskuj demo",
  categories,
  questions: categories.flatMap((category) =>
    pointRows.map((points, index) => ({
      id: `${category.id}-${points}`,
      categoryId: category.id,
      points,
      prompt: promptsByCategory[category.id][index],
      answer: "Demo odpověď"
    }))
  )
};
