# MP3 Upload Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Povolit nové audio uploady pouze jako MP3 do přesně 12 000 000 bajtů a nasadit stejné pravidlo do klienta, lokálního serveru i produkčního Workeru.

**Architecture:** Nový čistý modul `src/audio/uploadPolicy.ts` bude jediným zdrojem limitu, rozpoznání MP3 a API chybových zpráv. UI jej použije před odesláním, Express jej doplní limitem Multeru a Worker jej použije před zápisem do R2. Existující WAV odkazy a přehrávání zůstanou beze změny.

**Tech Stack:** TypeScript 6, React 19, Express 5, Multer 2, Vitest 4, React Testing Library, Supertest, Cloudflare Worker/D1/R2, Vite 8.

## Global Constraints

- Limit je přesně `12_000_000` bajtů, nikoli 12 MiB.
- MP3 o velikosti přesně 12 000 000 bajtů musí projít.
- MP3 o velikosti 12 000 001 bajtů musí být odmítnuto.
- Nové WAV uploady musí být odmítnuty, ale již uložené WAV musí zůstat přehratelné.
- Chyba formátu z API je `Only MP3 audio uploads are supported.`
- Chyba velikosti z API je `MP3 file must not exceed 12 MB.`
- Česká chyba formátu je `Nahrajte prosím soubor MP3.`
- Česká chyba velikosti je `MP3 soubor může mít maximálně 12 MB.`
- Změna se nasadí na existující privátní Site `riskuj-live`; nesmí vzniknout nový Site.

---

## File Map

- Create `src/audio/uploadPolicy.ts`: sdílené konstanty a čistá validace popisu souboru.
- Create `src/audio/uploadPolicy.test.ts`: hraniční testy formátu a velikosti.
- Modify `src/components/admin/AudioUploadField.tsx`: `.mp3` picker a kontrola před uploadem.
- Modify `src/components/admin/AudioUploadField.test.tsx`: UI chyby, hraniční velikost a zákaz WAV.
- Modify `src/api/gamesClient.ts`: mapování nových API chyb do češtiny.
- Modify `src/api/gamesClient.test.ts`: regresní testy mapování API chyb.
- Modify `server/index.ts`: pouze MP3, Multer limit 12 000 000 bajtů a správné rozlišení chyb.
- Modify `server/index.test.ts`: přijetí hraniční MP3, odmítnutí nadlimitní MP3 a WAV.
- Modify `worker/index.ts`: stejná sdílená validace před zápisem do R2; obsluha starých `.wav` URL zůstane.
- Create `worker/index.test.ts`: integrační test produkčního upload endpointu s falešnými D1/R2 bindingy.
- Modify `docs/superpowers/plans/2026-07-31-mp3-upload-limit.md`: odškrtávání provedených kroků není nutné commitovat do produkčního kódu.

### Task 1: Sdílená upload politika

**Files:**
- Create: `src/audio/uploadPolicy.test.ts`
- Create: `src/audio/uploadPolicy.ts`

**Interfaces:**
- Produces: `MAX_MP3_FILE_SIZE_BYTES: 12_000_000`
- Produces: `INVALID_MP3_UPLOAD_ERROR: "Only MP3 audio uploads are supported."`
- Produces: `MP3_TOO_LARGE_ERROR: "MP3 file must not exceed 12 MB."`
- Produces: `type AudioFileDescriptor = { name: string; type: string; size: number }`
- Produces: `getAudioUploadError(file: AudioFileDescriptor): string | undefined`

- [ ] **Step 1: Write the failing policy tests**

```ts
import { describe, expect, it } from "vitest";
import {
  getAudioUploadError,
  INVALID_MP3_UPLOAD_ERROR,
  MAX_MP3_FILE_SIZE_BYTES,
  MP3_TOO_LARGE_ERROR
} from "./uploadPolicy";

describe("getAudioUploadError", () => {
  it("povolí MP3 o velikosti přesně 12 000 000 bajtů", () => {
    expect(
      getAudioUploadError({
        name: "finale.mp3",
        type: "audio/mpeg",
        size: MAX_MP3_FILE_SIZE_BYTES
      })
    ).toBeUndefined();
  });

  it("odmítne MP3 o jeden bajt nad limitem", () => {
    expect(
      getAudioUploadError({
        name: "finale.mp3",
        type: "audio/mpeg",
        size: MAX_MP3_FILE_SIZE_BYTES + 1
      })
    ).toBe(MP3_TOO_LARGE_ERROR);
  });

  it("odmítne WAV", () => {
    expect(
      getAudioUploadError({
        name: "finale.wav",
        type: "audio/wav",
        size: 100
      })
    ).toBe(INVALID_MP3_UPLOAD_ERROR);
  });

  it("povolí příponu MP3 s obecným MIME typem", () => {
    expect(
      getAudioUploadError({
        name: "finale.MP3",
        type: "application/octet-stream",
        size: 100
      })
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/audio/uploadPolicy.test.ts`

Expected: FAIL because `./uploadPolicy` does not exist.

- [ ] **Step 3: Implement the minimal policy**

```ts
export const MAX_MP3_FILE_SIZE_BYTES = 12_000_000;
export const INVALID_MP3_UPLOAD_ERROR = "Only MP3 audio uploads are supported.";
export const MP3_TOO_LARGE_ERROR = "MP3 file must not exceed 12 MB.";

export type AudioFileDescriptor = {
  name: string;
  type: string;
  size: number;
};

export function getAudioUploadError(file: AudioFileDescriptor) {
  const lowerName = file.name.toLowerCase();
  const isMp3 =
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    lowerName.endsWith(".mp3");

  if (!isMp3) {
    return INVALID_MP3_UPLOAD_ERROR;
  }

  if (file.size > MAX_MP3_FILE_SIZE_BYTES) {
    return MP3_TOO_LARGE_ERROR;
  }

  return undefined;
}
```

- [ ] **Step 4: Run the policy tests and verify GREEN**

Run: `npm test -- src/audio/uploadPolicy.test.ts`

Expected: 4 tests pass.

- [ ] **Step 5: Commit the shared policy**

```powershell
git add src/audio/uploadPolicy.ts src/audio/uploadPolicy.test.ts
git commit -m "feat: define MP3 upload policy"
```

### Task 2: Klientská kontrola a české chyby

**Files:**
- Modify: `src/components/admin/AudioUploadField.test.tsx`
- Modify: `src/components/admin/AudioUploadField.tsx`
- Modify: `src/api/gamesClient.test.ts`
- Modify: `src/api/gamesClient.ts`

**Interfaces:**
- Consumes: `getAudioUploadError(File)`
- Consumes: `INVALID_MP3_UPLOAD_ERROR`
- Consumes: `MP3_TOO_LARGE_ERROR`
- Produces: input s `accept=".mp3"` a české UI chyby.

- [ ] **Step 1: Replace the WAV success test and add failing UI boundary tests**

Update `AudioUploadField.test.tsx` so the upload success case uses MP3 and asserts:

```ts
const file = new File(["ID3"], "intro.mp3", { type: "audio/mpeg" });
expect(input).toHaveAttribute("accept", ".mp3");
```

Add:

```ts
it("odmítne WAV bez volání uploadu", () => {
  const { onUploadAudio } = renderField();
  fireEvent.change(screen.getByLabelText("Upload audio"), {
    target: { files: [new File(["RIFF"], "intro.wav", { type: "audio/wav" })] }
  });

  expect(onUploadAudio).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Nahrajte prosím soubor MP3.");
});

it("odmítne MP3 větší než 12 MB bez volání uploadu", () => {
  const { onUploadAudio } = renderField();
  const file = new File(
    [new Uint8Array(12_000_001)],
    "intro.mp3",
    { type: "audio/mpeg" }
  );

  fireEvent.change(screen.getByLabelText("Upload audio"), {
    target: { files: [file] }
  });

  expect(onUploadAudio).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "MP3 soubor může mít maximálně 12 MB."
  );
});
```

- [ ] **Step 2: Run the field tests and verify RED**

Run: `npm test -- src/components/admin/AudioUploadField.test.tsx`

Expected: FAIL because WAV is accepted, `accept` contains `.wav`, and oversized MP3 calls the upload callback.

- [ ] **Step 3: Use the shared policy in the component**

Import the three policy exports, remove local `isSupportedAudioFile`, map:

```ts
const uploadError = getAudioUploadError(file);
if (uploadError === INVALID_MP3_UPLOAD_ERROR) {
  setError("Nahrajte prosím soubor MP3.");
  return;
}
if (uploadError === MP3_TOO_LARGE_ERROR) {
  setError("MP3 soubor může mít maximálně 12 MB.");
  return;
}
```

Set the file input to `accept=".mp3"`.

- [ ] **Step 4: Run the field tests and verify GREEN**

Run: `npm test -- src/components/admin/AudioUploadField.test.tsx`

Expected: all field tests pass.

- [ ] **Step 5: Write failing API error-mapping tests**

Replace the old MP3/WAV error expectation and add:

```ts
it("mapuje backend chybu pro jiný než MP3 soubor do češtiny", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      jsonResponse({ error: "Only MP3 audio uploads are supported." }, { status: 400 })
    )
  );

  await expect(
    uploadAudio(new File(["x"], "notes.txt", { type: "text/plain" }))
  ).rejects.toMatchObject({
    message: "Nahrajte prosím soubor MP3.",
    status: 400
  });
});

it("mapuje překročení 12 MB do češtiny", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      jsonResponse({ error: "MP3 file must not exceed 12 MB." }, { status: 400 })
    )
  );

  await expect(
    uploadAudio(new File(["ID3"], "large.mp3", { type: "audio/mpeg" }))
  ).rejects.toMatchObject({
    message: "MP3 soubor může mít maximálně 12 MB.",
    status: 400
  });
});
```

- [ ] **Step 6: Run the API client tests and verify RED**

Run: `npm test -- src/api/gamesClient.test.ts`

Expected: FAIL because the new backend messages are not mapped.

- [ ] **Step 7: Implement the API mappings**

In `createUploadError`, map `INVALID_MP3_UPLOAD_ERROR` to
`Nahrajte prosím soubor MP3.` and `MP3_TOO_LARGE_ERROR` to
`MP3 soubor může mít maximálně 12 MB.`. Keep the missing-file and network
messages unchanged.

- [ ] **Step 8: Run both client test files and verify GREEN**

Run:
`npm test -- src/components/admin/AudioUploadField.test.tsx src/api/gamesClient.test.ts`

Expected: both files pass.

- [ ] **Step 9: Commit the client behavior**

```powershell
git add src/components/admin/AudioUploadField.tsx src/components/admin/AudioUploadField.test.tsx src/api/gamesClient.ts src/api/gamesClient.test.ts
git commit -m "feat: validate MP3 uploads in admin"
```

### Task 3: Express upload enforcement

**Files:**
- Modify: `server/index.test.ts`
- Modify: `server/index.ts`

**Interfaces:**
- Consumes: `MAX_MP3_FILE_SIZE_BYTES`
- Consumes: `INVALID_MP3_UPLOAD_ERROR`
- Consumes: `MP3_TOO_LARGE_ERROR`
- Consumes: `getAudioUploadError`
- Produces: `400 { error: string }` without leaving rejected files on disk.

- [ ] **Step 1: Replace the WAV success test with failing rejection and boundary tests**

```ts
it("odmítne WAV upload", async () => {
  const app = createTestServer();
  const response = await request(app)
    .post("/api/uploads/audio")
    .attach("file", Buffer.from("RIFF"), {
      contentType: "audio/wav",
      filename: "effect.wav"
    })
    .expect(400);

  expect(response.body).toEqual({
    error: "Only MP3 audio uploads are supported."
  });
  await expect(fs.readdir(uploadsDir)).resolves.toEqual([]);
});

it("přijme MP3 o velikosti přesně 12 MB", async () => {
  const app = createTestServer();
  const response = await request(app)
    .post("/api/uploads/audio")
    .attach("file", Buffer.alloc(12_000_000), {
      contentType: "audio/mpeg",
      filename: "limit.mp3"
    })
    .expect(200);

  expect(response.body.src).toMatch(/^\/uploads\/[0-9a-f-]{36}\.mp3$/);
});

it("odmítne MP3 o jeden bajt nad 12 MB", async () => {
  const app = createTestServer();
  const response = await request(app)
    .post("/api/uploads/audio")
    .attach("file", Buffer.alloc(12_000_001), {
      contentType: "audio/mpeg",
      filename: "too-large.mp3"
    })
    .expect(400);

  expect(response.body).toEqual({
    error: "MP3 file must not exceed 12 MB."
  });
  await expect(fs.readdir(uploadsDir)).resolves.toEqual([]);
});
```

Update the generic invalid-format expectation to
`Only MP3 audio uploads are supported.`.

- [ ] **Step 2: Run server tests and verify RED**

Run: `npm test -- server/index.test.ts`

Expected: WAV test receives 200, oversized MP3 receives 200, and the old error copy differs.

- [ ] **Step 3: Enforce the policy in Multer**

Set:

```ts
limits: {
  fileSize: MAX_MP3_FILE_SIZE_BYTES
}
```

Use `getAudioUploadError({ name: file.originalname, type: file.mimetype, size: 0 })`
inside `fileFilter`. Store new uploads only with `.mp3` and `audio/mpeg`.
When the callback receives `error instanceof multer.MulterError` with
`error.code === "LIMIT_FILE_SIZE"`, return `MP3_TOO_LARGE_ERROR`; when it
receives the format error, return `INVALID_MP3_UPLOAD_ERROR`.

- [ ] **Step 4: Run server tests and verify GREEN**

Run: `npm test -- server/index.test.ts`

Expected: all server endpoint tests pass and rejected uploads leave no files.

- [ ] **Step 5: Commit Express enforcement**

```powershell
git add server/index.ts server/index.test.ts
git commit -m "feat: enforce MP3 size limit on server"
```

### Task 4: Production Worker enforcement

**Files:**
- Modify: `worker/index.ts`
- Create: `worker/index.test.ts`

**Interfaces:**
- Consumes: `getAudioUploadError(File)`
- Consumes: `INVALID_MP3_UPLOAD_ERROR`
- Consumes: `MP3_TOO_LARGE_ERROR`
- Produces: no R2 or D1 write after a rejected upload.

- [ ] **Step 1: Write failing Worker endpoint tests**

Create a fake D1 statement whose `bind` returns itself and whose `run`, `all`
and `first` methods resolve. Pass an R2 binding with `put: vi.fn()`. Then test
real requests against the exported Worker handler:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

function createEnv() {
  const statement = {
    bind: vi.fn(),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({}),
    all: vi.fn().mockResolvedValue({ results: [] })
  };
  statement.bind.mockReturnValue(statement);

  return {
    env: {
      DB: {
        prepare: vi.fn().mockReturnValue(statement),
        batch: vi.fn().mockResolvedValue([])
      },
      UPLOADS: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue({})
      }
    },
    statement
  };
}

async function upload(file: File, env: ReturnType<typeof createEnv>["env"]) {
  const body = new FormData();
  body.append("file", file);
  return worker.fetch(
    new Request("https://riskuj.test/api/uploads/audio", {
      method: "POST",
      body
    }),
    env
  );
}

describe("produkční Worker upload", () => {
  it("odmítne WAV bez zápisu do R2", async () => {
    const { env } = createEnv();
    const response = await upload(
      new File(["RIFF"], "effect.wav", { type: "audio/wav" }),
      env
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Only MP3 audio uploads are supported."
    });
    expect(env.UPLOADS.put).not.toHaveBeenCalled();
  });

  it("odmítne MP3 nad 12 MB bez zápisu do R2", async () => {
    const { env } = createEnv();
    const response = await upload(
      new File(
        [new Uint8Array(12_000_001)],
        "large.mp3",
        { type: "audio/mpeg" }
      ),
      env
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "MP3 file must not exceed 12 MB."
    });
    expect(env.UPLOADS.put).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the Worker tests and verify RED**

Run: `npm test -- worker/index.test.ts`

Expected: WAV receives 200 and the oversized MP3 reaches the R2 `put` mock.

- [ ] **Step 3: Replace Worker-local format logic**

Import the policy exports. In `uploadAudio`, after confirming `file instanceof
File`, call `getAudioUploadError(file)` and immediately return
`json({ error: uploadError }, 400)` when it returns a message. Always write the
accepted object as `${id}.mp3` with `audio/mpeg`.

Keep `audioKeyPattern` and `serveAudio` compatible with both `.mp3` and `.wav`
so old WAV URLs remain playable. Remove only upload-specific WAV helpers and
branches.

- [ ] **Step 4: Run the Worker tests and verify GREEN**

Run: `npm test -- worker/index.test.ts`

Expected: both Worker endpoint tests pass without R2 writes.

- [ ] **Step 5: Run focused upload tests**

Run:
`npm test -- src/audio/uploadPolicy.test.ts src/components/admin/AudioUploadField.test.tsx src/api/gamesClient.test.ts server/index.test.ts worker/index.test.ts`

Expected: all focused tests pass.

- [ ] **Step 6: Commit Worker enforcement**

```powershell
git add worker/index.ts worker/index.test.ts
git commit -m "feat: enforce MP3 size limit in production"
```

### Task 5: Full verification and redeployment

**Files:**
- Verify all modified source and test files.
- Rebuild `dist/`.
- Package the existing Site using `.openai/hosting.json`.

**Interfaces:**
- Consumes: existing `project_id` from `.openai/hosting.json`.
- Produces: a saved Sites version and successful private production deployment.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all test files and tests pass with exit code 0.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript exits 0 and Vite produces `dist/server/index.js` plus
`dist/client`.

- [ ] **Step 3: Inspect the final source state**

Run:

```powershell
git diff --check
git status --short --branch
git log -5 --oneline
```

Expected: clean worktree on `codex/sites-deploy`.

- [ ] **Step 4: Push exact HEAD to the existing Sites source repository**

Obtain a fresh short-lived repository credential for the existing
`project_id`, then use per-command HTTP authorization. Do not persist or print
the token. Push `HEAD:main` and record `git rev-parse HEAD`.

- [ ] **Step 5: Package and save the exact build**

Run the Sites `package-site.sh` helper against the project and a temporary
archive. Call `save_site_version` with the exact HEAD SHA and that archive.

Expected: a new saved version number for the existing Riskuj Site.

- [ ] **Step 6: Deploy privately and poll**

Call `deploy_private_site_version`, then poll `get_deployment_status` until
`status` is `succeeded` or `failed`.

Expected: `succeeded` with
`https://riskuj-live.dawe-bartos.chatgpt.site`.

- [ ] **Step 7: Report the verified result**

Report the focused behavior, full test count, build result, deployment URL,
and the branch/commits created. Do not claim completion before Steps 1–6 have
fresh successful evidence.
