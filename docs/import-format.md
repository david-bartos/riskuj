# Import a export hry

Admin umí hru uložit do jednoho JSON souboru a stejný soubor znovu načíst. Je to formát pro rychlou přípravu otázek před kvízem: pošlete si JSON, upravíte texty a v adminu ho importujete zpátky.

## Jak import použít

1. V adminu otevři hru.
2. Klikni na `Exportovat JSON` a ulož si zálohu.
3. Upravený soubor nahraj přes `Importovat JSON`.
4. Import nahradí aktuálně otevřenou hru a rovnou ji uloží na server.

Audio soubory nejsou v JSON vložené. V JSON je jen cesta k souboru, typicky `/uploads/nazev.mp3` nebo `/uploads/nazev.wav`. Samotné MP3/WAV nahraj v adminu přes pole `Upload audio`.

## Podporovaný tvar

Kořenový objekt musí mít formát `riskuj-game/v1`:

```json
{
  "format": "riskuj-game/v1",
  "exportedAt": "2026-05-30T12:00:00.000Z",
  "game": {
    "id": "hudebni-riskuj-66",
    "title": "Hudební Riskuj 6.6",
    "createdAt": "2026-05-30T12:00:00.000Z",
    "updatedAt": "2026-05-30T12:00:00.000Z",
    "teams": [
      { "id": "team-1", "name": "Tým 1" },
      { "id": "team-2", "name": "Tým 2" }
    ],
    "categories": [
      { "id": "ceske-hity", "title": "České hity" }
    ],
    "questions": [
      {
        "id": "ceske-hity-1000",
        "categoryId": "ceske-hity",
        "points": 1000,
        "prompt": "Kdo nazpíval Lady Carneval?",
        "answer": "Karel Gott",
        "moderatorNote": "Uznat i příjmení.",
        "audio": {
          "id": "audio-lady-carneval",
          "src": "/uploads/lady-carneval.mp3",
          "title": "Ukázka Lady Carneval"
        }
      }
    ],
    "listeningGenres": [
      { "id": "rock", "title": "Rock" }
    ],
    "listeningItems": [
      {
        "id": "poslech-1",
        "genreId": "rock",
        "categoryId": "rock",
        "title": "Bohemian Rhapsody",
        "artist": "Queen",
        "prompt": "Poznej interpreta a skladbu.",
        "answer": "Queen - Bohemian Rhapsody",
        "trackTitleAnswer": "Bohemian Rhapsody",
        "artistAnswer": "Queen",
        "audio": {
          "id": "audio-bohemian-rhapsody",
          "src": "/uploads/bohemian-rhapsody.mp3",
          "title": "Bohemian Rhapsody"
        }
      }
    ],
    "commonDenominator": {
      "answer": "Queen",
      "clues": [
        { "id": "queen-1", "text": "Freddie Mercury", "prompt": "Freddie Mercury" },
        { "id": "queen-2", "text": "We Will Rock You", "prompt": "We Will Rock You" }
      ]
    },
    "rounds": [
      {
        "id": "round-otazky",
        "type": "question",
        "title": "První kolo",
        "categories": [
          { "id": "ceske-hity", "title": "České hity" }
        ],
        "questions": [
          {
            "id": "ceske-hity-1000",
            "categoryId": "ceske-hity",
            "points": 1000,
            "prompt": "Kdo nazpíval Lady Carneval?",
            "answer": "Karel Gott"
          }
        ]
      },
      {
        "id": "round-poslech",
        "type": "listening",
        "title": "Poslechové kolo",
        "categories": [
          { "id": "rock", "title": "Rock" }
        ],
        "tracks": []
      },
      {
        "id": "round-spolecny-jmenovatel",
        "type": "common-denominator",
        "title": "Společný jmenovatel",
        "answer": "Queen",
        "clues": []
      }
    ]
  }
}
```

## Pravidla validace

- `format` musí být přesně `riskuj-game/v1`.
- Povinná pole nesmí chybět ani být prázdná.
- ID v jednom seznamu musí být unikátní.
- Typ kola musí být `question`, `listening` nebo `common-denominator`.
- Audio cesta má být relativní cesta z aplikace, hlavně `/uploads/soubor.mp3`. Demo hra může používat `/demo-audio/...`.
- JSON neobsahuje base64 audio ani odkazy na lokální disk.

Když import selže, admin ukáže českou chybu včetně místa v datech, například `game.rounds[0].questions`.

## Plán pro CSV/XLSX

CSV/XLSX import bude později jen převodník do stejného JSON modelu. Praktický plán:

- Jeden list pro první kolo: kategorie, hodnota, otázka, odpověď, poznámka, audio cesta.
- Jeden list pro poslechy: žánr, interpret, skladba, odpověď, audio cesta.
- Jeden list pro společný jmenovatel: odpověď, indicie, volitelná audio cesta.
- Po načtení tabulky se nejdřív ukáže náhled a až potom se vygeneruje `riskuj-game/v1`.
