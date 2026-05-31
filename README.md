# Riskuj

Hudební český kvíz pro moderovanou hru. Admin slouží k přípravě hry, presenter běží na projektoru nebo obrazovce a moderátor v něm ručně vybírá otázky, pouští audio, odhaluje odpovědi a zapisuje body.

Tento README je psaný pro lidi i pro LM agenty. Člověk podle něj rozjede aplikaci a připraví hru, agent podle něj dokáže vygenerovat správný importní JSON.

## Právní poznámka a duševní vlastnictví

Toto je nezávislá kvízová aplikace. Není spojena s žádným televizním pořadem,
deskovou hrou, vydavatelem, vysílatelem, držitelem práv ani vlastníkem ochranné
známky; žádná taková strana ji neschválila ani nesponzoruje.

Licence MIT se vztahuje pouze na původní zdrojový kód a dokumentaci v tomto
repozitáři. Neuděluje práva k cizím ochranným známkám, názvům pořadů, názvům
her, audiu, grafice, sadám otázek ani jinému obsahu třetích stran.

## Pro lidi: vytvoření hry pomocí ChatGPT, Gemini nebo Claude

Můžeš použít ChatGPT, Gemini, Claude nebo jiný LM nástroj k přípravě celé hry. Nejjednodušší postup:

1. Zkopíruj agentovi části `Schéma importu/exportu JSON`, `Audio položky`, `Zvukové efekty` a `Úplný příklad JSON`.
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
Hra má mít 6 týmů, 3 kola, audio položky jako /uploads/nazev.mp3 nebo /uploads/nazev.wav,
a vyplněné kořenové projekce i rounds tak, aby šla importovat do adminu.
```

Když audio soubory ještě nemáš nahrané, použij v JSONu stabilní placeholdery jako `/uploads/fx-correct.wav` nebo `/uploads/queen-bohemian.mp3`. Potom soubory nahraj do aplikace a podle potřeby JSON nebo hru v adminu uprav.

## Instalace z GitHubu a lokální spuštění

Předpoklad: repozitář je veřejný na GitHubu a uživatel si ho klonuje lokálně.

Požadavky:

- Git.
- Node.js 22 LTS nebo novější.
- npm, který je součástí Node.js.
- Moderní prohlížeč, ideálně Chrome, Edge nebo Firefox.

### Windows PowerShell

```powershell
git clone <repo-url> riskuj
cd riskuj
npm run setup:windows
npm run dev
```

Otevři `http://localhost:5173/`.

Pokud nechceš použít nastavovací skript:

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

Pokud nechceš použít nastavovací skript:

```bash
npm ci
mkdir -p data/games data/uploads
[ -f data/audio-assets.json ] || printf '[]\n' > data/audio-assets.json
npm run dev
```

### Lokální běh ve stylu produkce

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

Běhová data se při spuštění přes compose ukládají do lokálního `./data`, protože compose mapuje `./data:/app/data`.

Bez compose:

```bash
docker build -t riskuj .
docker run --rm -p 3000:3000 -v "$PWD/data:/app/data" riskuj
```

Na Windows PowerShellu pro ruční `docker run` použij:

```powershell
docker run --rm -p 3000:3000 -v "${PWD}/data:/app/data" riskuj
```

Volitelná ochrana pomocí Basic Auth:

```bash
docker run --rm -p 3000:3000 \
  -e BASIC_AUTH_USER=admin \
  -e BASIC_AUTH_PASSWORD=secret \
  -v "$PWD/data:/app/data" \
  riskuj
```

### Sestavení image přes GitHub Actions

GitHub Actions sestaví Docker image pro každý pull request a každý push do
větve `main`.

- Pull requesty nahrají artefakt běhu `riskuj-image-<sha>`, který obsahuje
  gzipovaný tarball Docker image.
- Pushe do `main` navíc publikují `ghcr.io/david-bartos/riskuj:latest` a
  `ghcr.io/david-bartos/riskuj:<sha>`.

Použití artefaktu běhu lokálně:

```bash
gh run download <run-id> --name riskuj-image-<sha>
gunzip -c riskuj-image-<sha>.tar.gz | docker load
docker run --rm -p 3000:3000 riskuj:<sha>
```

Stažení publikovaného image po sestavení větve `main`:

```bash
docker pull ghcr.io/david-bartos/riskuj:latest
docker run --rm -p 3000:3000 ghcr.io/david-bartos/riskuj:latest
```

## Rychlá reference pro agenta

- Výchozí stránka aplikace je admin: `http://localhost:5173/`.
- Presenter hry je `/play/<gameId>`, například `http://localhost:5173/play/riskuj-2026-06-06`.
- Import/export v adminu používá obalový JSON objekt s `format: "riskuj-game/v1"`, `exportedAt` a `game`.
- Při ruční tvorbě JSONu drž vždy synchronizované kořenové projekce i `rounds`: `categories` + `questions` musí odpovídat otázkovému kolu, `listeningGenres` + `listeningItems` musí odpovídat poslechovému kolu, `commonDenominator` musí odpovídat kolu se společným jmenovatelem.
- Audio nikdy nevkládej jako base64. Nejdřív nahraj MP3/WAV přes admin nebo API, pak do JSONu vlož vrácený `AudioAsset`.
- Zvukové efekty jsou uložené v `game.soundEffects.effects` a používají stejné objekty `AudioAsset` jako otázky a ukázky.
- Po změnách ověř minimálně `npm run build`; při změnách logiky spusť i `npm test`.

## Reference vývojářských příkazů

```bash
npm install
npm run dev
```

`npm run dev` spustí Vite klienta na `http://localhost:5173` a Express API na `http://localhost:3001`. Klient proxyuje `/api/*` na server.

Oddělené spuštění:

```bash
npm run dev:client
npm run dev:server
```

Port serveru:

```bash
PORT=3101 npm run dev:server
```

Pro čistou instalaci podle `package-lock.json` použij `npm ci`. Pro produkční lokální běh použij `npm run build` a potom `npm start`.

Volitelná ochrana pomocí Basic Auth se zapne jen při nastavení obou proměnných:

```bash
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=secret
```

## Průchod aplikací

1. Otevři admin na `/`.
2. Vyber existující hru, nebo klikni `Nová hra`.
3. Nastav týmy, kola, otázky, poslechy, společný jmenovatel a zvukové efekty.
4. Audio ukázky a efekty nahraj přes `Upload audio`, nebo přes API `/api/uploads/audio`.
5. Klikni `Uložit hru`.
6. Klikni `Spustit hru`, nebo otevři `/play/<gameId>`.

Admin umí také `Exportovat JSON` a `Importovat JSON`. Import nahradí aktuálně otevřenou hru a hned ji uloží na server.

## Lokální data

Běhová data jsou v adresáři `data/`:

- `data/games/<gameId>.json` obsahuje uložené hry.
- `data/uploads/` obsahuje nahrané MP3/WAV soubory.
- `data/audio-assets.json` obsahuje knihovnu nahraných audio položek pro výběrová pole v adminu.

Tyto běhové soubory jsou lokální a git je ignoruje. Při přenosu hry na jiný počítač přenes JSON hry i odpovídající soubory z `data/uploads/`.

## API

Kontrola stavu:

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

Pozor: API `PUT /api/games/<gameId>` očekává přímo objekt `game` bez obalového objektu. Admin tlačítko `Importovat JSON` očekává obal `{ "format": "riskuj-game/v1", "exportedAt": "...", "game": { ... } }`.

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

## Audio položky

Podporované soubory: `.mp3` a `.wav`.

Server přijme MIME typy `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/wave`, `audio/x-wav`, nebo soubory s příponou `.mp3` či `.wav`. Výběr souboru v klientu používá jednoduchý filtr `.mp3,.wav`.

Tvar audio položky:

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

## Zvukové efekty

Efekty se nastavují pro každou hru zvlášť:

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

Když je `enabled` nastavené na `false`, presenter efekty nepřehrává, i když jsou audio položky vyplněné.

## Schéma importu/exportu JSON

Import z adminu očekává obalový objekt:

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

### Tým

```json
{ "id": "team-1", "name": "Koťata", "color": "#ef4444" }
```

`color` je volitelná CSS barva používaná v presenteru.

### Otázkové kolo

Kořenová projekce:

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

Odpovídající kolo:

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

`items` je doporučený alias pro novější presenter. `questions` je povinné kvůli validaci importu a kompatibilitě.

### Poslechové kolo

Kořenová projekce:

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

Odpovídající kolo:

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

Do `tracks` i `items` vlož stejná data poslechových položek. `tracks` je povinné kvůli validaci importu, `items` je doporučené pro presenter.

Bodování poslechů v presenteru používá pevné hodnoty: interpret `1000`, název skladby `3000`, obojí `5000`, nic `0`.

### Kolo se společným jmenovatelem

Kořenová projekce:

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

Odpovídající kolo:

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

Aktuální admin umí editovat `commonDenominatorItems` interně a při uložení je promítne do `rounds[].items`. Pro ruční import je nejbezpečnější vyplnit kořenové `commonDenominator`, `clues` v kole i `items` v kole.

## Úplný příklad JSON

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

## Validační pravidla a časté chyby

- `format` musí být přesně `riskuj-game/v1`.
- `game.id` smí obsahovat písmena, číslice, pomlčku a podtržítko.
- `createdAt`, `updatedAt` a `exportedAt` jsou ISO časové značky.
- ID v jednom seznamu musí být unikátní.
- `Round.type` musí být `question`, `listening` nebo `common-denominator`.
- Otázky musí mít `id`, `categoryId`, `points`, `prompt`, `answer`.
- Poslechové položky musí mít minimálně `id`, `prompt`, `answer`; pro admin doporučeně také `genreId`, `categoryId`, `artist`, `title`.
- Indicie musí mít `id` a alespoň `text` nebo `prompt`.
- Audio `src` má být relativní cesta `/uploads/*.mp3`, `/uploads/*.wav` nebo demo cesta `/demo-audio/...`.
- JSON nesmí obsahovat lokální diskové cesty jako `C:\...` ani `file://...`.
- Pokud agent vytvoří jen `rounds` bez kořenových `categories` a `questions`, import selže. Vyplň obě projekce.

## Ukázková hra Riskuj 6.6

Verzovaná ukázková hra je v `src/data/riskuj-2026-06-06.ts` a je dostupná přes API i klientský záložní zdroj jako `riskuj-2026-06-06`.

- 1. kolo má 24 položek a hodnoty `1000`, `3000`, `5000`, `10000`.
- 2. kolo má 15 poslechových položek.
- 3. kolo má položky společného jmenovatele.

Ukázková hra používá lokální sloty `/uploads/riskuj-66-listen-XX.mp3`. Před ostrou akcí nahraj finální audio a ulož hru v adminu.

## Kontroly kvality

```bash
npm run build
npm test
```
