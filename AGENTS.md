# Repository Guidelines

## Project Structure & Module Organization

Riskuj is a Vite + React + TypeScript quiz app with a small Node/Express server. Client code lives in `src/`: routes in `src/routes`, reusable UI in `src/components`, game data in `src/data`, hooks in `src/hooks`, API helpers in `src/api`, import/export logic in `src/importExport`, and shared types in `src/types`. Server code is in `server/`. Tests are colocated as `*.test.ts` or `*.test.tsx`. Static audio and browser assets are in `public/`; runtime data is under `data/`; format docs are in `docs/`.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run setup:unix` / `npm run setup:windows`: install dependencies and initialize `data/`.
- `npm run dev`: run Vite on `http://localhost:5173` and the API server on `http://localhost:3001`.
- `npm run dev:client` / `npm run dev:server`: start one side only.
- `npm run build`: type-check with `tsc --noEmit` and build the Vite app.
- `npm test`: run the Vitest test suite once.
- `npm start`: run the server for a production-style local build.
- `docker compose up --build`: build and run the containerized app on `http://localhost:3000`.

## Coding Style & Naming Conventions

Use TypeScript modules and React function components. Follow the existing two-space indentation, double-quoted strings, and semicolon-free style. Name React components/files in PascalCase, for example `GameEditor.tsx`; hooks start with `use`, for example `useGameSession.ts`; utilities use camelCase, for example `gameJson.ts`. Keep domain types in `src/types`.

## Testing Guidelines

Vitest runs in `jsdom` with setup from `src/test/setup.ts`. Put tests next to the code they cover using `*.test.ts` or `*.test.tsx`. Use React Testing Library for UI behavior and `supertest` for server endpoints. Run `npm test` for logic, imports, storage, API behavior, or tested UI flow changes; run `npm run build` before submitting.

## Commit & Pull Request Guidelines

History uses short imperative commits, often with prefixes such as `feat:`, `fix:`, and `chore(deps-dev):`. Keep commits focused and describe behavior, for example `fix: open presenter prompt on tile click`. Pull requests must go through maintainer review on `main`, include a clear description, link issues when available, and add screenshots or notes for visible UI changes. Do not commit `node_modules/`, `dist/`, `.env`, or runtime files in `data/`.

## Security & Configuration Tips

Report vulnerabilities privately as described in `SECURITY.md`. Do not contribute copyrighted audio, proprietary question packs, artwork, logos, or brand assets without rights. Basic Auth is enabled only when both `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` are set.
