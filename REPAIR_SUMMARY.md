# PR 17 Merge Repair Summary

Resolved merge conflicts by keeping `origin/main`'s repository-backed server API, validation, client routing, and admin `GameEditor` structure as the base, then reintroduced PR #17 audio/presenter behavior through compatibility adapters.

Files changed:
- `.gitignore`
- `server/index.ts`, `server/index.test.ts`
- `src/types/game.ts`
- `src/api/gamesClient.ts`
- `src/data/demoGame.ts`, `src/data/demoGame.test.ts`
- `src/App.tsx`, `src/App.test.tsx`
- `src/routes/AdminPage.tsx`, `src/routes/AdminPage.test.tsx`
- `src/routes/PlayPage.tsx`, `src/routes/PlayPage.test.tsx`
- `src/components/admin/GameEditor.tsx`
- `src/components/admin/QuestionEditor.tsx`

Key outcomes:
- MP3 uploads persist as audio assets and static files using opaque `/uploads/<uuid>.mp3` URLs.
- Admin editor can upload, choose, attach, and preview MP3s for question, listening, and common-denominator items.
- Saved editor data is projected back into canonical `rounds` for server validation and presenter loading.
- `/play/:gameId` loads game data via the game API client and handles question, listening, and common-denominator rounds.
- Presenter Enter flow, manual scoring, completed tile disabling, and pre-reveal leak safety are covered by regression tests.

Verification:
- `grep -RIn --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist -E '<<<<<<<|=======|>>>>>>>' .` exited 1 with no matches.
- `npm test -- --run` passed: 16 test files, 108 tests.
- `npm run build` passed: `tsc --noEmit` and Vite production build completed.
