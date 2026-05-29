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
