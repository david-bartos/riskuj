# Riskuj

Hudební český kvíz pro moderovanou hru. Admin slouží k přípravě hry, presenter běží na projektoru nebo obrazovce a moderátor v něm ručně vybírá otázky, pouští audio, odhaluje odpovědi a zapisuje body.

Tento README je psaný pro lidi i pro LM agenty. Člověk podle něj rozjede aplikaci a připraví hru, agent podle něj dokáže vygenerovat správný importní JSON.

## Legal and IP note

This is an independent quiz-game application. It is not affiliated with,
endorsed by, sponsored by, or connected to any television show, board game,
publisher, broadcaster, rights holder, or trademark owner.

The MIT License covers only the original source code and documentation in this
repository. It does not grant rights to third-party trademarks, show names,
game titles, audio, artwork, question packs, or other third-party content.

## For humans: create a game with ChatGPT, Gemini or Claude

Můžeš použít ChatGPT, Gemini, Claude nebo jiný LM nástroj k přípravě celé hry. Nejjednodušší postup:

1. Zkopíruj agentovi části `JSON import/export schema`, `Audio assets`, `Sound effects` a `Complete JSON example`.
2. Dej mu svoje zadání: téma hry, počet týmů, názvy týmů, kola, kategorie, otázky, odpovědi, poslechy, společný jmenovatel a jaké zvukové efekty chceš.
3. Řekni mu, ať vrátí jediný validní JSON ve formátu `riskuj-game/v1`, bez Markdown komentářů okolo.
4. Výsledek ulož jako soubor, například `moje-hra.json`.
5. Otevři admin `http://localhost:5173/`, klikni `Importovat JSON` a vyber soubor.
6. Nahraj chybějící MP3/WAV soubory přes `Upload audio`, nebo je nejdřív nahraj přes API a do JSONu vlož vrácené `/uploads/...` cesty.
7. Klikni `Uložit hru` a potom `Spustit hru`.

Krátký prompt pro LM nástroj:

```text
Vytvoř importní JSON pro aplikaci Riskuj ve formátu riskuj-game/v1.
Použij schéma z README níže. Vrať pouze validní JSON.
Hra má mít 6 týmů, 3 kola, audio assety jako /uploads/nazev.mp3 nebo /uploads/nazev.wav,
a vyplněné top-level projekce i rounds tak, aby šla importovat do adminu.
```

Když audio soubory ještě nemáš nahrané, použij v JSONu stabilní placeholdery jako `/uploads/fx-correct.wav` nebo `/uploads/queen-bohemian.mp3`. Potom soubory nahraj do aplikace a podle potřeby JSON nebo hru v adminu uprav.

## Install from GitHub and run locally

Předpoklad: repozitář je veřejný na GitHubu a uživatel si ho klonuje lokálně.

Prerequisites:

- Git.
- Node.js 22 LTS nebo novější.
- npm, který je součástí Node.js.
- Moderní browser, ideálně Chrome, Edge nebo Firefox.

### Windows PowerShell

```powershell
git clone <repo-url> riskuj
cd riskuj
npm run setup:windows
npm run dev
```

Otevři `http://localhost:5173/`.

Pokud nechceš použít setup skript:

```powershell
npm ci
New-Item -ItemType Directory -Force -Path data,data/games,data/uploads
if (!(Test-Path data/audio-assets.json)) { "[]" | Set-Content data/audio-assets.json }
npm run dev
```

### macOS / Linux

```bash
git clone <repo-url> riskuj
cd riskuj
npm run setup:unix
npm run dev
```

Otevři `http://localhost:5173/`.

Pokud nechceš použít setup skript:

```bash
npm ci
mkdir -p data/games data/uploads
[ -f data/audio-assets.json ] || printf '[]\n' > data/audio-assets.json
npm run dev
```

### Production-style local run

```bash
npm ci
npm run build
PORT=3000 npm start
```

Otevři `http://localhost:3000/`.

### Docker

Dockerfile i `docker-compose.yml` jsou součástí repo.

```bash
docker compose up --build
```

Otevři `http://localhost:3000/`.

Runtime data se při compose spuštění ukládají do lokálního `./data`, protože compose mapuje `./data:/app/data`.

Bez compose:

```bash
docker build -t riskuj .
docker run --rm -p 3000:3000 -v "$PWD/data:/app/data" riskuj
```

Na Windows PowerShellu pro ruční `docker run` použij:

```powershell
docker run --rm -p 3000:3000 -v "${PWD}/data:/app/data" riskuj
```

Volitelná Basic Auth ochrana:

```bash
docker run --rm -p 3000:3000 \
  -e BASIC_AUTH_USER=admin \
  -e BASIC_AUTH_PASSWORD=secret \
  -v "$PWD/data:/app/data" \
  riskuj
```

## Agent quick reference

- Výchozí stránka aplikace je admin: `http://localhost:5173/`.
- Presenter hry je `/play/<gameId>`, například `http://localhost:5173/play/riskuj-2026-06-06`.
- Import/export v adminu používá wrapper JSON objekt s `format: "riskuj-game/v1"`, `exportedAt` a `game`.
- Při ruční tvorbě JSONu drž vždy synchronizované top-level projekce i `rounds`: `categories` + `questions` musí odpovídat question roundu, `listeningGenres` + `listeningItems` musí odpovídat listening roundu, `commonDenominator` musí odpovídat common-denominator roundu.
- Audio nikdy nevkládej jako base64. Nejdřív nahraj MP3/WAV přes admin nebo API, pak do JSONu vlož vrácený `AudioAsset`.
- Sound efekty jsou uložené v `game.soundEffects.effects` a používají stejné `AudioAsset` objekty jako otázky a ukázky.
- Po změnách ověř minimálně `npm run build`; při změnách logiky spusť i `npm test`.

## Developer command reference

```bash
npm install
npm run dev
```

`npm run dev` spustí Vite klienta na `http://localhost:5173` a Express API na `http://localhost:3001`. Klient proxyuje `/api/*` na backend.

Oddělené spuštění:

```bash
npm run dev:client
npm run dev:server
```

Backend port:

```bash
PORT=3101 npm run dev:server
```

Pro čistou instalaci podle lockfile použij `npm ci`. Pro produkční lokální běh použij `npm run build` a potom `npm start`.

Volitelná Basic Auth ochrana se zapne jen při nastavení obou proměnných:

```bash
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=secret
```

## App workflow

1. Otevři admin na `/`.
2. Vyber existující hru, nebo klikni `Nová hra`.
3. Nastav týmy, kola, otázky, poslechy, společný jmenovatel a zvukové efekty.
4. Audio ukázky a efekty nahraj přes `Upload audio`, nebo přes API `/api/uploads/audio`.
5. Klikni `Uložit hru`.
6. Klikni `Spustit hru`, nebo otevři `/play/<gameId>`.

Admin umí také `Exportovat JSON` a `Importovat JSON`. Import nahradí aktuálně otevřenou hru a hned ji uloží na server.

## Local data

Runtime data jsou v adresáři `data/`:

- `data/games/<gameId>.json` obsahuje uložené hry.
- `data/uploads/` obsahuje nahrané MP3/WAV soubory.
- `data/audio-assets.json` obsahuje knihovnu nahraných audio assetů pro selecty v adminu.

Tyto runtime soubory jsou lokální a git je ignoruje. Při přenosu hry na jiný počítač přenes JSON hry i odpovídající soubory z `data/uploads/`.

## API

Health check:

```bash
curl http://localhost:3001/api/health
```

Hry:

```bash
curl http://localhost:3001/api/games
curl http://localhost:3001/api/games/riskuj-2026-06-06
curl -X POST http://localhost:3001/api/games \
  -H "content-type: application/json" \
  -d '{"title":"Nová hra"}'
curl -X PUT http://localhost:3001/api/games/<gameId> \
  -H "content-type: application/json" \
  --data-binary @runtime-game-object.json
```

Pozor: API `PUT /api/games/<gameId>` očekává přímo objekt `game` bez wrapperu. Admin tlačítko `Importovat JSON` očekává wrapper `{ "format": "riskuj-game/v1", "exportedAt": "...", "game": { ... } }`.

Audio knihovna:

```bash
curl http://localhost:3001/api/audio-assets
curl -F "file=@song.mp3;type=audio/mpeg" \
  -F "title=Ukázka" \
  http://localhost:3001/api/uploads/audio
curl -F "file=@effect.wav;type=audio/wav" \
  -F "title=Správná odpověď" \
  http://localhost:3001/api/audio-assets
```

`/api/uploads/audio` vrací `200`, kompatibilní `/api/audio-assets` vrací `201`. Oba endpointy uloží soubor do `data/uploads/`, přidají položku do `data/audio-assets.json` a vrátí `AudioAsset`.

## Audio assets

Podporované soubory: `.mp3` a `.wav`.

Backend přijme MIME typy `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/wave`, `audio/x-wav`, nebo soubory s příponou `.mp3` či `.wav`. Frontend file picker používá jednoduchý filtr `.mp3,.wav`.

Tvar audio assetu:

```json
{
  "id": "2b7ecedc-7228-4824-b531-7fa07a5c99df",
  "src": "/uploads/2b7ecedc-7228-4824-b531-7fa07a5c99df.mp3",
  "title": "Ukázka Queen",
  "originalName": "queen.mp3",
  "displayName": "Ukázka Queen",
  "mimeType": "audio/mpeg"
}
```

Povinné pro import jsou `id`, `src`, `title`. Ostatní pole jsou užitečná pro admin, ale nejsou povinná. `src` musí začínat `/uploads/` nebo `/demo-audio/`.

Audio lze nalinkovat na těchto místech:

- `question.audio` pro otázku prvního kola.
- `listeningItem.audio` pro poslechovou položku; doporučené je dát stejné `src` i do `audioUrl` kvůli kompatibilitě.
- `commonDenominator.clues[].audio` nebo `commonDenominatorRound.clues[].audio` pro indicie.
- `game.soundEffects.effects.<key>` pro efekty hry.

## Sound effects

Efekty se nastavují per game:

```json
{
  "soundEffects": {
    "enabled": true,
    "effects": {
      "questionSelected": { "id": "fx-select", "src": "/uploads/fx-select.wav", "title": "Označení otázky" },
      "questionOpened": { "id": "fx-open", "src": "/uploads/fx-open.wav", "title": "Otevření dialogu" },
      "answerRevealed": { "id": "fx-answer", "src": "/uploads/fx-answer.wav", "title": "Zobrazení odpovědi" },
      "correctAnswer": { "id": "fx-correct", "src": "/uploads/fx-correct.wav", "title": "Správná odpověď" },
      "wrongAnswer": { "id": "fx-wrong", "src": "/uploads/fx-wrong.wav", "title": "Špatná odpověď" },
      "placementRevealed": { "id": "fx-place", "src": "/uploads/fx-place.wav", "title": "Odhalení umístění" },
      "firstPlaceRevealed": { "id": "fx-first", "src": "/uploads/fx-first.wav", "title": "Odhalení 1. místa" }
    }
  }
}
```

Klíče efektů:

- `questionSelected`: první klik na dlaždici.
- `questionOpened`: otevření otázkového dialogu.
- `answerRevealed`: zobrazení odpovědi.
- `correctAnswer`: přidělení bodů týmu.
- `wrongAnswer`: označení, že nikdo neuhodl.
- `placementRevealed`: odhalení běžného umístění ve finále.
- `firstPlaceRevealed`: odhalení prvního místa ve finále.

Když `enabled` je `false`, presenter efekty nepřehrává, i když jsou assety vyplněné.

## JSON import/export schema

Import z adminu očekává wrapper:

```json
{
  "format": "riskuj-game/v1",
  "exportedAt": "2026-05-31T12:00:00.000Z",
  "game": {}
}
```

`game` má tento praktický tvar:

```ts
type Game = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  teams: Team[];
  rounds: Round[];
  soundEffects?: GameSoundEffects;
  categories: Category[];
  questions: QuestionItem[];
  listeningGenres?: Category[];
  listeningItems?: ListeningItem[];
  commonDenominator?: {
    answer: string;
    clues: CommonDenominatorClue[];
  };
  knownIssues?: KnownIssue[];
};
```

Povinná pole při importu: `id`, `title`, `createdAt`, `updatedAt`, `teams`, `rounds`, `categories`, `questions`. Volitelná, ale doporučená pole pro plnou editaci jsou `listeningGenres`, `listeningItems`, `commonDenominator` a `soundEffects`.

### Team

```json
{ "id": "team-1", "name": "Koťata", "color": "#ef4444" }
```

`color` je volitelná CSS barva používaná v presenteru.

### Question round

Top-level projekce:

```json
"categories": [
  { "id": "pop", "title": "Pop" }
],
"questions": [
  {
    "id": "pop-1000",
    "categoryId": "pop",
    "points": 1000,
    "value": 1000,
    "prompt": "Kdo nazpíval Firework?",
    "answer": "Katy Perry",
    "moderatorNote": "Stačí příjmení.",
    "audio": { "id": "audio-firework", "src": "/uploads/firework.mp3", "title": "Firework ukázka" },
    "options": [
      { "id": "a", "label": "A", "text": "Katy Perry" },
      { "id": "b", "label": "B", "text": "Lady Gaga" }
    ],
    "correctOptionId": "a"
  }
]
```

Odpovídající round:

```json
{
  "id": "round-1",
  "type": "question",
  "title": "1. kolo: Otázky",
  "categories": [{ "id": "pop", "title": "Pop" }],
  "questions": [{ "id": "pop-1000", "categoryId": "pop", "points": 1000, "value": 1000, "prompt": "Kdo nazpíval Firework?", "answer": "Katy Perry" }],
  "items": [{ "id": "pop-1000", "categoryId": "pop", "points": 1000, "value": 1000, "prompt": "Kdo nazpíval Firework?", "answer": "Katy Perry" }]
}
```

`items` je doporučený alias pro novější presenter. `questions` je povinné kvůli import validaci a kompatibilitě.

### Listening round

Top-level projekce:

```json
"listeningGenres": [
  { "id": "rock", "title": "Rock" }
],
"listeningItems": [
  {
    "id": "listen-1",
    "genreId": "rock",
    "categoryId": "rock",
    "title": "Bohemian Rhapsody",
    "trackTitle": "Bohemian Rhapsody",
    "artist": "Queen",
    "prompt": "Poznej interpreta a název skladby.",
    "answer": "Queen - Bohemian Rhapsody",
    "artistAnswer": "Queen",
    "trackTitleAnswer": "Bohemian Rhapsody",
    "points": 5000,
    "value": 5000,
    "audioUrl": "/uploads/queen-bohemian.mp3",
    "audio": { "id": "audio-queen-bohemian", "src": "/uploads/queen-bohemian.mp3", "title": "Queen - Bohemian Rhapsody" }
  }
]
```

Odpovídající round:

```json
{
  "id": "round-2",
  "type": "listening",
  "title": "2. kolo: Poslechy",
  "categories": [{ "id": "rock", "title": "Rock" }],
  "genres": [{ "id": "rock", "title": "Rock" }],
  "tracks": [],
  "items": []
}
```

Do `tracks` i `items` vlož stejná listening item data. `tracks` je povinné kvůli import validaci, `items` je doporučené pro presenter.

Bodování poslechů v presenteru používá pevné hodnoty: interpret `1000`, track `3000`, obojí `5000`, nic `0`.

### Common denominator round

Top-level projekce:

```json
"commonDenominator": {
  "answer": "Queen",
  "clues": [
    {
      "id": "queen-clue-1",
      "order": 1,
      "text": "Freddie Mercury",
      "prompt": "Freddie Mercury",
      "audio": { "id": "audio-freddie", "src": "/uploads/freddie.wav", "title": "Freddie indicie" }
    }
  ]
}
```

Odpovídající round:

```json
{
  "id": "round-3",
  "type": "common-denominator",
  "title": "3. kolo: Společný jmenovatel",
  "answer": "Queen",
  "points": 5000,
  "clues": [
    { "id": "queen-clue-1", "order": 1, "text": "Freddie Mercury", "prompt": "Freddie Mercury" }
  ],
  "items": [
    {
      "id": "common-queen",
      "title": "Společný jmenovatel: Queen",
      "value": 5000,
      "answer": "Queen",
      "clues": [
        { "id": "queen-clue-1", "order": 1, "text": "Freddie Mercury", "prompt": "Freddie Mercury" }
      ],
      "explanation": "Všechny indicie vedou ke skupině Queen."
    }
  ]
}
```

Aktuální admin umí editovat `commonDenominatorItems` interně a při uložení je promítne do `rounds[].items`. Pro ruční import je nejbezpečnější vyplnit top-level `commonDenominator`, round `clues` i round `items`.

## Complete JSON example

Tento minimální příklad lze použít jako šablonu pro import. V reálné hře rozšiř `categories`, `questions`, `listeningItems` a `commonDenominator.clues` podle potřeby.

```json
{
  "format": "riskuj-game/v1",
  "exportedAt": "2026-05-31T12:00:00.000Z",
  "game": {
    "id": "demo-agent-game",
    "title": "Demo hra od agenta",
    "createdAt": "2026-05-31T12:00:00.000Z",
    "updatedAt": "2026-05-31T12:00:00.000Z",
    "teams": [
      { "id": "team-1", "name": "Koťata", "color": "#ef4444" },
      { "id": "team-2", "name": "Štěňata", "color": "#3b82f6" }
    ],
    "soundEffects": {
      "enabled": true,
      "effects": {
        "correctAnswer": { "id": "fx-correct", "src": "/uploads/fx-correct.wav", "title": "Správně" },
        "wrongAnswer": { "id": "fx-wrong", "src": "/uploads/fx-wrong.wav", "title": "Špatně" }
      }
    },
    "categories": [
      { "id": "pop", "title": "Pop" }
    ],
    "questions": [
      {
        "id": "pop-1000",
        "categoryId": "pop",
        "points": 1000,
        "value": 1000,
        "prompt": "Kdo nazpíval Firework?",
        "answer": "Katy Perry",
        "audio": { "id": "audio-firework", "src": "/uploads/firework.mp3", "title": "Firework ukázka" }
      }
    ],
    "listeningGenres": [
      { "id": "rock", "title": "Rock" }
    ],
    "listeningItems": [
      {
        "id": "listen-1",
        "genreId": "rock",
        "categoryId": "rock",
        "title": "Bohemian Rhapsody",
        "trackTitle": "Bohemian Rhapsody",
        "artist": "Queen",
        "prompt": "Poznej interpreta a název skladby.",
        "answer": "Queen - Bohemian Rhapsody",
        "artistAnswer": "Queen",
        "trackTitleAnswer": "Bohemian Rhapsody",
        "points": 5000,
        "value": 5000,
        "audioUrl": "/uploads/queen-bohemian.mp3",
        "audio": { "id": "audio-queen-bohemian", "src": "/uploads/queen-bohemian.mp3", "title": "Queen - Bohemian Rhapsody" }
      }
    ],
    "commonDenominator": {
      "answer": "Queen",
      "clues": [
        { "id": "queen-clue-1", "order": 1, "text": "Freddie Mercury", "prompt": "Freddie Mercury" },
        { "id": "queen-clue-2", "order": 2, "text": "We Will Rock You", "prompt": "We Will Rock You" }
      ]
    },
    "rounds": [
      {
        "id": "round-1",
        "type": "question",
        "title": "1. kolo: Otázky",
        "categories": [{ "id": "pop", "title": "Pop" }],
        "questions": [
          {
            "id": "pop-1000",
            "categoryId": "pop",
            "points": 1000,
            "value": 1000,
            "prompt": "Kdo nazpíval Firework?",
            "answer": "Katy Perry",
            "audio": { "id": "audio-firework", "src": "/uploads/firework.mp3", "title": "Firework ukázka" }
          }
        ],
        "items": [
          {
            "id": "pop-1000",
            "categoryId": "pop",
            "points": 1000,
            "value": 1000,
            "prompt": "Kdo nazpíval Firework?",
            "answer": "Katy Perry",
            "audio": { "id": "audio-firework", "src": "/uploads/firework.mp3", "title": "Firework ukázka" }
          }
        ]
      },
      {
        "id": "round-2",
        "type": "listening",
        "title": "2. kolo: Poslechy",
        "categories": [{ "id": "rock", "title": "Rock" }],
        "genres": [{ "id": "rock", "title": "Rock" }],
        "tracks": [
          {
            "id": "listen-1",
            "genreId": "rock",
            "categoryId": "rock",
            "title": "Bohemian Rhapsody",
            "trackTitle": "Bohemian Rhapsody",
            "artist": "Queen",
            "prompt": "Poznej interpreta a název skladby.",
            "answer": "Queen - Bohemian Rhapsody",
            "artistAnswer": "Queen",
            "trackTitleAnswer": "Bohemian Rhapsody",
            "points": 5000,
            "value": 5000,
            "audioUrl": "/uploads/queen-bohemian.mp3",
            "audio": { "id": "audio-queen-bohemian", "src": "/uploads/queen-bohemian.mp3", "title": "Queen - Bohemian Rhapsody" }
          }
        ],
        "items": [
          {
            "id": "listen-1",
            "genreId": "rock",
            "categoryId": "rock",
            "title": "Bohemian Rhapsody",
            "trackTitle": "Bohemian Rhapsody",
            "artist": "Queen",
            "prompt": "Poznej interpreta a název skladby.",
            "answer": "Queen - Bohemian Rhapsody",
            "artistAnswer": "Queen",
            "trackTitleAnswer": "Bohemian Rhapsody",
            "points": 5000,
            "value": 5000,
            "audioUrl": "/uploads/queen-bohemian.mp3",
            "audio": { "id": "audio-queen-bohemian", "src": "/uploads/queen-bohemian.mp3", "title": "Queen - Bohemian Rhapsody" }
          }
        ]
      },
      {
        "id": "round-3",
        "type": "common-denominator",
        "title": "3. kolo: Společný jmenovatel",
        "answer": "Queen",
        "points": 5000,
        "clues": [
          { "id": "queen-clue-1", "order": 1, "text": "Freddie Mercury", "prompt": "Freddie Mercury" },
          { "id": "queen-clue-2", "order": 2, "text": "We Will Rock You", "prompt": "We Will Rock You" }
        ],
        "items": [
          {
            "id": "common-queen",
            "title": "Společný jmenovatel: Queen",
            "value": 5000,
            "answer": "Queen",
            "clues": [
              { "id": "queen-clue-1", "order": 1, "text": "Freddie Mercury", "prompt": "Freddie Mercury" },
              { "id": "queen-clue-2", "order": 2, "text": "We Will Rock You", "prompt": "We Will Rock You" }
            ],
            "explanation": "Všechny indicie vedou ke skupině Queen."
          }
        ]
      }
    ]
  }
}
```

## Validation rules and pitfalls

- `format` musí být přesně `riskuj-game/v1`.
- `game.id` smí obsahovat písmena, číslice, pomlčku a podtržítko.
- `createdAt`, `updatedAt` a `exportedAt` jsou ISO timestampy.
- ID v jednom seznamu musí být unikátní.
- `Round.type` musí být `question`, `listening` nebo `common-denominator`.
- Otázky musí mít `id`, `categoryId`, `points`, `prompt`, `answer`.
- Poslechové položky musí mít minimálně `id`, `prompt`, `answer`; pro admin doporučeně také `genreId`, `categoryId`, `artist`, `title`.
- Indicie musí mít `id` a alespoň `text` nebo `prompt`.
- Audio `src` má být relativní cesta `/uploads/*.mp3`, `/uploads/*.wav` nebo demo cesta `/demo-audio/...`.
- JSON nesmí obsahovat lokální diskové cesty jako `C:\...` ani `file://...`.
- Pokud agent vytvoří jen `rounds` bez top-level `categories` a `questions`, import selže. Vyplň obě projekce.

## Seed Riskuj 6.6

Git-tracked seed je v `src/data/riskuj-2026-06-06.ts` a je dostupný přes API i klientský fallback jako `riskuj-2026-06-06`.

- 1. kolo má 24 položek a hodnoty `1000`, `3000`, `5000`, `10000`.
- 2. kolo má 15 poslechových položek.
- 3. kolo má položky společného jmenovatele.

Seed používá lokální `/uploads/riskuj-66-listen-XX.mp3` sloty. Před ostrou akcí nahraj finální audio a ulož hru v adminu.

## Quality checks

```bash
npm run build
npm test
```
