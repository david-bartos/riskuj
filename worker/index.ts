import { getSeedGame, listSeedGames } from "../src/data/games";
import type { AudioAsset, Game, GameSummary } from "../src/types/game";
import {
  assertValidGame,
  createEmptyGame,
  GameValidationError
} from "../server/gameValidation";

type D1Result<T> = {
  results: T[];
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T>(): Promise<D1Result<T>>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
};

type R2ObjectBody = {
  body: ReadableStream;
  httpMetadata?: {
    contentType?: string;
  };
};

type R2Bucket = {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
};

type Env = {
  DB: D1Database;
  UPLOADS: R2Bucket;
};

type GameRow = {
  game_json: string;
};

type AudioAssetRow = {
  metadata_json: string;
};

const gameIdPattern = /^[a-zA-Z0-9_-]+$/;
const audioKeyPattern = /^[a-f0-9-]+\.(mp3|wav)$/;
const audioUploadRequiredMessage = 'Audio file is required in multipart field "file".';
const invalidAudioMessage = "Only MP3 or WAV audio uploads are supported.";
let schemaReady: Promise<void> | undefined;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      await ensureSchema(env.DB);

      const url = new URL(request.url);
      const { pathname } = url;

      if (request.method === "GET" && pathname === "/healthz") {
        return new Response("ok\n", {
          headers: { "content-type": "text/plain; charset=utf-8" }
        });
      }

      if (request.method === "GET" && pathname === "/api/health") {
        return json({ status: "ok" });
      }

      if (request.method === "GET" && pathname === "/api/games") {
        return listGames(env.DB);
      }

      const gameId = readPathParameter(pathname, "/api/games/");
      if (gameId && request.method === "GET") {
        return loadGame(env.DB, gameId);
      }

      if (request.method === "POST" && pathname === "/api/games") {
        return createGame(request, env.DB);
      }

      if (gameId && request.method === "PUT") {
        return saveGame(request, env.DB, gameId);
      }

      if (request.method === "GET" && pathname === "/api/audio-assets") {
        return listAudioAssets(env.DB);
      }

      if (
        request.method === "POST" &&
        (pathname === "/api/audio-assets" || pathname === "/api/uploads/audio")
      ) {
        return uploadAudio(request, env);
      }

      const uploadKey = readPathParameter(pathname, "/uploads/");
      if (request.method === "GET" && uploadKey) {
        return serveAudio(env.UPLOADS, uploadKey);
      }

      return json({ message: "Nenalezeno." }, 404);
    } catch (error) {
      if (error instanceof GameValidationError) {
        return json(
          {
            message: "Hru se nepodařilo uložit.",
            details: error.details
          },
          400
        );
      }

      console.error(error);
      return json({ message: "Nastala chyba serveru." }, 500);
    }
  }
};

async function ensureSchema(db: D1Database) {
  schemaReady ??= db
    .batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          game_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS audio_assets (
          id TEXT PRIMARY KEY,
          object_key TEXT NOT NULL,
          metadata_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `)
    ])
    .then(() => undefined);

  await schemaReady;
}

async function listGames(db: D1Database) {
  const rows = await db
    .prepare("SELECT game_json FROM games ORDER BY updated_at DESC")
    .all<GameRow>();
  const runtimeGames = rows.results.map(readGameRow);
  const runtimeIds = new Set(runtimeGames.map((game) => game.id));
  const runtimeSummaries = runtimeGames.map(createGameSummary);
  const seedSummaries = listSeedGames()
    .filter((game) => !runtimeIds.has(game.id))
    .map(({ teamCount: _teamCount, knownIssueCount: _knownIssueCount, ...summary }) => summary);

  return json([...runtimeSummaries, ...seedSummaries]);
}

async function loadGame(db: D1Database, id: string) {
  if (!isSafeGameId(id)) {
    return json({ message: "Neplatné ID hry." }, 400);
  }

  const row = await db
    .prepare("SELECT game_json FROM games WHERE id = ?")
    .bind(id)
    .first<GameRow>();

  if (row) {
    return json(readGameRow(row));
  }

  const seedGame = getSeedGame(id);
  return seedGame ? json(seedGame) : json({ message: "Hra nebyla nalezena." }, 404);
}

async function createGame(request: Request, db: D1Database) {
  const body = await readJsonBody(request);
  const game = isFullGamePayload(body)
    ? body
    : createEmptyGame(readOptionalTitle(body));

  assertValidGame(game);
  assertSafeGameId(game.id);
  await persistGame(db, game);

  return json(game, 201);
}

async function saveGame(request: Request, db: D1Database, id: string) {
  if (!isSafeGameId(id)) {
    return json({ message: "Neplatné ID hry." }, 400);
  }

  const body = await readJsonBody(request);
  if (!isRecord(body) || body.id !== id) {
    throw new GameValidationError(["ID hry v adrese neodpovídá tělu požadavku."]);
  }

  const game = {
    ...body,
    updatedAt: new Date().toISOString()
  };

  assertValidGame(game);
  await persistGame(db, game);

  return json(game);
}

async function persistGame(db: D1Database, game: Game) {
  await db
    .prepare(`
      INSERT INTO games (id, game_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        game_json = excluded.game_json,
        updated_at = excluded.updated_at
    `)
    .bind(game.id, JSON.stringify(game), game.updatedAt ?? game.createdAt ?? "")
    .run();
}

async function listAudioAssets(db: D1Database) {
  const rows = await db
    .prepare("SELECT metadata_json FROM audio_assets ORDER BY created_at DESC")
    .all<AudioAssetRow>();

  return json(
    rows.results.map((row) => JSON.parse(row.metadata_json) as AudioAsset)
  );
}

async function uploadAudio(request: Request, env: Env) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return json({ error: audioUploadRequiredMessage }, 400);
  }

  const extension = audioExtension(file);
  if (!extension) {
    return json({ error: invalidAudioMessage }, 400);
  }

  const id = crypto.randomUUID();
  const objectKey = `${id}${extension}`;
  const title = titleFromUpload(file, formData.get("title") ?? formData.get("displayName"));
  const mimeType = extension === ".wav" ? "audio/wav" : "audio/mpeg";
  const asset: AudioAsset = {
    id,
    src: `/uploads/${objectKey}`,
    title,
    originalName: file.name,
    displayName: title,
    mimeType
  };

  await env.UPLOADS.put(objectKey, file.stream(), {
    httpMetadata: { contentType: mimeType }
  });
  await env.DB
    .prepare(`
      INSERT INTO audio_assets (id, object_key, metadata_json, created_at)
      VALUES (?, ?, ?, ?)
    `)
    .bind(id, objectKey, JSON.stringify(asset), new Date().toISOString())
    .run();

  return json(asset, request.url.includes("/api/audio-assets") ? 201 : 200);
}

async function serveAudio(bucket: R2Bucket, key: string) {
  if (!audioKeyPattern.test(key)) {
    return json({ message: "Neplatné audio." }, 400);
  }

  const object = await bucket.get(key);
  if (!object) {
    return json({ message: "Audio nebylo nalezeno." }, 404);
  }

  return new Response(object.body, {
    headers: {
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": object.httpMetadata?.contentType ?? audioMimeTypeFromKey(key)
    }
  });
}

function readGameRow(row: GameRow) {
  const parsed = JSON.parse(row.game_json) as unknown;
  assertValidGame(parsed);
  return parsed;
}

function createGameSummary(game: Game): GameSummary {
  return {
    id: game.id,
    title: game.title,
    updatedAt: game.updatedAt ?? game.createdAt ?? "",
    roundCount: game.rounds.length
  };
}

function audioExtension(file: File): ".mp3" | ".wav" | undefined {
  const filename = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === "audio/mpeg" || type === "audio/mp3" || filename.endsWith(".mp3")) {
    return ".mp3";
  }

  if (
    type === "audio/wav" ||
    type === "audio/wave" ||
    type === "audio/x-wav" ||
    filename.endsWith(".wav")
  ) {
    return ".wav";
  }

  return undefined;
}

function titleFromUpload(file: File, formTitle: FormDataEntryValue | null) {
  const title = typeof formTitle === "string" ? formTitle.trim() : "";
  if (title) {
    return title;
  }

  return file.name.replace(/\.(mp3|wav)$/i, "");
}

function audioMimeTypeFromKey(key: string) {
  return key.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new GameValidationError(["Požadavek musí obsahovat platný JSON."]);
  }
}

function readPathParameter(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) {
    return "";
  }

  try {
    return decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return "";
  }
}

function isFullGamePayload(value: unknown): value is Game {
  return isRecord(value) && "id" in value && "teams" in value && "rounds" in value;
}

function readOptionalTitle(value: unknown) {
  return isRecord(value) && typeof value.title === "string" ? value.title : undefined;
}

function assertSafeGameId(id: string) {
  if (!isSafeGameId(id)) {
    throw new GameValidationError([
      "ID hry smí obsahovat jen písmena, číslice, pomlčku a podtržítko."
    ]);
  }
}

function isSafeGameId(id: string) {
  return gameIdPattern.test(id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store" }
  });
}
