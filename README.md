# Riskuj

Hudební český kvíz pro moderovanou hru ve stylu retro televizní soutěže. Aplikace je dělaná pro notebook moderátora a projekci na plátno: admin připraví otázky, poslechy a společný jmenovatel, presenter pak hru pouští ve fullscreenu.

## Instalace

```bash
npm install
```

Pro čistou instalaci z `package-lock.json` lze použít i:

```bash
npm ci
```

## Spuštění

```bash
npm run dev
```

Vývojový příkaz spustí Vite klienta na `http://localhost:5173` a Express API na `http://localhost:3001`. Klient má nastavenou proxy, takže volání `/api/*` směřují na backend.

Oddělené spuštění:

```bash
npm run dev:client
npm run dev:server
```

Backend port lze změnit přes `PORT`, například:

```bash
PORT=3101 npm run dev:server
```

## Příprava hry

1. Otevři `http://localhost:5173/admin`.
2. Vyber existující hru nebo klikni na `Nová hra`.
3. Vyplň první kolo: kategorie, hodnoty, zadání otázek a správné odpovědi.
4. Vyplň druhé kolo: žánry, poslechové položky, interpreta, název skladby a odpověď pro moderátora.
5. Vyplň třetí kolo: společný jmenovatel a indicie.
6. Klikni na `Uložit hru`.

Admin umí také `Exportovat JSON` a `Importovat JSON`. Export je dobrý jako záloha před větší úpravou. Import nahradí otevřenou hru a hned ji uloží. Přesný formát je popsaný v [docs/import-format.md](docs/import-format.md).

## Upload MP3

U otázek, poslechových položek a indicií je pole `Nahrát MP3 k položce`.

- Nahraj soubor `.mp3`.
- Po uploadu se audio uloží do `data/uploads/`.
- Hra si do JSON uloží jen relativní cestu typu `/uploads/abc.mp3`.
- V adminu lze audio rovnou přehrát jako náhled.
- V presenteru se stejná cesta použije pro přehrání během soutěže.

MP3 se nedávají do exportovaného JSON jako base64. Pokud hru přenášíš na jiný počítač, přenes i odpovídající soubory z `data/uploads/`.

## Hraní a fullscreen

Presenter otevři na `http://localhost:5173/play`.

- Notebook připoj k projektoru nebo televizi.
- V prohlížeči zapni fullscreen klávesou `F11` nebo tlačítkem v aplikaci, pokud je dostupné.
- Moderátor ovládá postup hry ručně: vybere dlaždici, zobrazí otázku, pustí případné audio, odhalí odpověď a zapíše body.
- Pro kvíz 6.6 je počítáno se 6 týmy a se všemi třemi koly: otázky, poslechy, společný jmenovatel.

## Lokální data

Runtime data jsou uložená v adresáři `data/`:

- `data/games/` obsahuje uložené hry. Každá hra má vlastní podsložku a soubor `game.json`.
- `data/uploads/` obsahuje nahrané MP3 soubory.
- `data/audio-assets.json` obsahuje seznam nahraných audio položek pro výběr v adminu.

Adresáře jsou v repozitáři držené přes `.gitkeep`, ale jejich runtime obsah je ignorovaný gitem. Otázky a MP3 pro ostrou akci tedy zůstávají lokálně, dokud je výslovně nepřeneseš jinam.

Uploadovaná audia jsou servírovaná relativně z `/uploads/<soubor>.mp3`.

## Kontroly kvality

```bash
npm run build
npm test
```

## API

Health check:

```bash
curl http://localhost:3001/api/health
```

Odpověď:

```json
{ "status": "ok" }
```

Upload MP3:

```bash
curl -F "file=@song.mp3;type=audio/mpeg" \
  -F "title=Ukázka" \
  http://localhost:3001/api/uploads/audio
```

Endpoint přijímá multipart pole `file` a volitelné textové pole `title`. Soubor je přijatý, pokud má MIME typ `audio/mpeg`, `audio/mp3` nebo název končí na `.mp3`. Při chybě validace vrací `400` JSON error.

Odpověď:

```json
{
  "id": "audio-1710000000000-a1b2c3d4e5f6",
  "src": "/uploads/audio-1710000000000-a1b2c3d4e5f6.mp3",
  "title": "Ukázka"
}
```
