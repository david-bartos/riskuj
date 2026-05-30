# Riskuj

Hudební český kvíz pro moderovanou hru ve stylu retro televizní soutěže.

## Spuštění

```bash
npm install
npm run dev
```

Vývojový příkaz spustí Vite klienta na `http://localhost:5173` a Express API
na `http://localhost:3001`. Klient má nastavenou proxy, takže volání `/api/*`
směřují na backend.

Oddělené spuštění:

```bash
npm run dev:client
npm run dev:server
```

Backend port lze změnit přes `PORT`, například `PORT=3101 npm run dev:server`.

## Lokální data

Runtime data jsou uložená v adresáři `data/`:

- `data/games/` je připravené místo pro lokální herní data.
- `data/uploads/` obsahuje nahrané audio soubory.

Adresáře jsou v repozitáři držené přes `.gitkeep`, ale jejich runtime obsah je
ignorovaný gitem. Nahraná MP3 se tedy necommitují.

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

Endpoint přijímá multipart pole `file` a volitelné textové pole `title`.
Soubor je přijatý, pokud má MIME typ `audio/mpeg` nebo název končí na `.mp3`.
Při chybě validace vrací `400` JSON error.

Odpověď:

```json
{
  "id": "audio-1710000000000-a1b2c3d4e5f6",
  "src": "/uploads/audio-1710000000000-a1b2c3d4e5f6.mp3",
  "title": "Ukázka"
}
```
