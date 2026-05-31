import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { AudioAsset, Game } from "../src/types/game";
import { getSeedGame, listSeedGames } from "../src/data/games";
import { assertValidGame, createEmptyGame, GameValidationError } from "./gameValidation";
import { GamesRepository, isSafeGameId } from "./gamesRepository";

type CreateServerOptions = {
  gamesDirectory?: string;
  uploadsDir?: string;
  audioAssetsPath?: string;
  staticDir?: string;
};

interface AudioUploadRequest extends express.Request {
  generatedAudioId?: string;
  generatedAudioExtension?: ".mp3" | ".wav";
}

const defaultUploadsDir = resolve(process.cwd(), "data", "uploads");
const defaultAudioAssetsPath = resolve(process.cwd(), "data", "audio-assets.json");
const defaultStaticDir = resolve(process.cwd(), "dist");
const audioUploadRequiredMessage = 'Audio file is required in multipart field "file".';
const invalidAudioMessage = "Only MP3 or WAV audio uploads are supported.";

const asyncHandler =
  (handler: express.RequestHandler): express.RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

function createAudioId() {
  return randomUUID();
}

function audioExtension(file: Express.Multer.File): ".mp3" | ".wav" | undefined {
  const originalName = file.originalname.toLowerCase();
  if (
    file.mimetype === "audio/mpeg" ||
    file.mimetype === "audio/mp3" ||
    originalName.endsWith(".mp3")
  ) {
    return ".mp3";
  }

  if (
    file.mimetype === "audio/wav" ||
    file.mimetype === "audio/wave" ||
    file.mimetype === "audio/x-wav" ||
    originalName.endsWith(".wav")
  ) {
    return ".wav";
  }

  return undefined;
}

function audioMimeType(extension: ".mp3" | ".wav") {
  return extension === ".wav" ? "audio/wav" : "audio/mpeg";
}

function isAcceptedAudio(file: Express.Multer.File) {
  return audioExtension(file) !== undefined;
}

function titleFromUpload(file: Express.Multer.File, formTitle: unknown) {
  const title = typeof formTitle === "string" ? formTitle.trim() : "";

  if (title) {
    return title;
  }

  const filename = basename(file.originalname);
  const extension = extname(filename);

  return extension.toLowerCase() === ".mp3" || extension.toLowerCase() === ".wav"
    ? filename.slice(0, -extension.length)
    : filename;
}

export function createServer(options: CreateServerOptions = {}) {
  const app = express();
  const gamesRepository = new GamesRepository(options.gamesDirectory);
  const uploadsDir = options.uploadsDir ?? defaultUploadsDir;
  const audioAssetsPath = options.audioAssetsPath ?? defaultAudioAssetsPath;
  const staticDir = options.staticDir ?? defaultStaticDir;

  mkdirSync(uploadsDir, { recursive: true });

  app.get("/healthz", (_request, response) => {
    response.type("text/plain").send("ok\n");
  });

  app.use(basicAuthMiddleware);

  async function readAudioAssets(): Promise<AudioAsset[]> {
    try {
      return JSON.parse(await readFile(audioAssetsPath, "utf8")) as AudioAsset[];
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async function appendAudioAsset(asset: AudioAsset) {
    const assets = await readAudioAssets();
    await writeFile(audioAssetsPath, `${JSON.stringify([...assets, asset], null, 2)}\n`, "utf8");
  }

  const upload = multer({
    fileFilter: (_request, file, callback) => {
      if (isAcceptedAudio(file)) {
        callback(null, true);
        return;
      }

      callback(new Error(invalidAudioMessage));
    },
    storage: multer.diskStorage({
      destination: (_request, _file, callback) => {
        callback(null, uploadsDir);
      },
      filename: (request: AudioUploadRequest, _file, callback) => {
        const audioId = createAudioId();
        request.generatedAudioExtension = audioExtension(_file);
        request.generatedAudioId = audioId;
        callback(null, `${audioId}${request.generatedAudioExtension ?? ".mp3"}`);
      }
    })
  });

  function handleAudioUpload(statusCode: 200 | 201): express.RequestHandler {
    return (request: AudioUploadRequest, response) => {
      upload.single("file")(request, response, (error: unknown) => {
        if (error) {
          response.status(400).json({
            error:
              error instanceof Error && error.message === invalidAudioMessage
                ? invalidAudioMessage
                : audioUploadRequiredMessage
          });
          return;
        }

        if (!request.file || !request.generatedAudioId || !request.generatedAudioExtension) {
          response.status(400).json({ error: audioUploadRequiredMessage });
          return;
        }

        const title = titleFromUpload(request.file, request.body.title ?? request.body.displayName);
        const asset: AudioAsset = {
          id: request.generatedAudioId,
          src: `/uploads/${request.generatedAudioId}${request.generatedAudioExtension}`,
          title,
          originalName: request.file.originalname,
          displayName: title,
          mimeType: audioMimeType(request.generatedAudioExtension)
        };

        void appendAudioAsset(asset)
          .then(() => {
            response.status(statusCode).json(asset);
          })
          .catch((appendError: unknown) => {
            response.locals.uploadAppendError = appendError;
            response.status(500).json({ message: "Nastala chyba serveru." });
          });
      });
    };
  }

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get(
    "/api/games",
    asyncHandler(async (_request, response) => {
      const runtimeGames = await gamesRepository.list();
      const runtimeIds = new Set(runtimeGames.map((game) => game.id));
      const seedSummaries = listSeedGames()
        .filter((game) => !runtimeIds.has(game.id))
        .map(({ teamCount: _teamCount, knownIssueCount: _knownIssueCount, ...summary }) => summary);

      response.json([...runtimeGames, ...seedSummaries]);
    })
  );

  app.get(
    "/api/games/:id",
    asyncHandler(async (request, response) => {
      const id = readRouteId(request.params.id);

      if (!isSafeGameId(id)) {
        response.status(400).json({ message: "Neplatné ID hry." });
        return;
      }

      const game = await gamesRepository.load(id);

      if (!game) {
        const seedGame = getSeedGame(id);
        if (seedGame) {
          response.json(seedGame);
          return;
        }

        response.status(404).json({ message: "Hra nebyla nalezena." });
        return;
      }

      response.json(game);
    })
  );

  app.post(
    "/api/games",
    asyncHandler(async (request, response) => {
      const game = isFullGamePayload(request.body)
        ? request.body
        : createEmptyGame(readOptionalTitle(request.body));

      assertValidGame(game);
      assertSafeGameId(game.id);
      const savedGame = await gamesRepository.save(game);

      response.status(201).json(savedGame);
    })
  );

  app.put(
    "/api/games/:id",
    asyncHandler(async (request, response) => {
      const id = readRouteId(request.params.id);

      if (!isSafeGameId(id)) {
        response.status(400).json({ message: "Neplatné ID hry." });
        return;
      }

      if (!isRecord(request.body) || request.body.id !== id) {
        throw new GameValidationError(["ID hry v adrese neodpovídá tělu požadavku."]);
      }

      const game = {
        ...request.body,
        updatedAt: new Date().toISOString()
      };

      assertValidGame(game);
      const savedGame = await gamesRepository.save(game);

      response.json(savedGame);
    })
  );

  app.get(
    "/api/audio-assets",
    asyncHandler(async (_request, response) => {
      response.json(await readAudioAssets());
    })
  );
  app.post("/api/audio-assets", handleAudioUpload(201));
  app.post("/api/uploads/audio", handleAudioUpload(200));

  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));

    app.get(/.*/, (request, response, next) => {
      if (request.path.startsWith("/api/")) {
        next();
        return;
      }

      response.sendFile(resolve(staticDir, "index.html"));
    });
  }

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof GameValidationError) {
        response.status(400).json({
          message: "Hru se nepodařilo uložit.",
          details: error.details
        });
        return;
      }

      console.error(error);
      response.status(500).json({ message: "Nastala chyba serveru." });
    }
  );

  return app;
}

function basicAuthMiddleware(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    next();
    return;
  }

  const authHeader = request.header("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Basic" || !token) {
    requestBasicAuth(response);
    return;
  }

  const decoded = Buffer.from(token, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (user !== expectedUser || password !== expectedPassword) {
    requestBasicAuth(response);
    return;
  }

  next();
}

function requestBasicAuth(response: express.Response) {
  response.setHeader("WWW-Authenticate", 'Basic realm="Riskuj", charset="UTF-8"');
  response.status(401).send("Authentication required");
}

function isFullGamePayload(value: unknown): value is Game {
  return isRecord(value) && "id" in value && "teams" in value && "rounds" in value;
}

function readOptionalTitle(value: unknown) {
  if (!isRecord(value) || typeof value.title !== "string") {
    return undefined;
  }

  return value.title;
}

function readRouteId(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function assertSafeGameId(id: string) {
  if (!isSafeGameId(id)) {
    throw new GameValidationError([
      "ID hry smí obsahovat jen písmena, číslice, pomlčku a podtržítko."
    ]);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createServer();

  app.listen(port, () => {
    console.log(`Riskuj API běží na http://localhost:${port}`);
  });
}
