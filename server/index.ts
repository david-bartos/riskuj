import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { AudioAsset, Game } from "../src/types/game";
import { assertValidGame, createEmptyGame, GameValidationError } from "./gameValidation";
import { GamesRepository, isSafeGameId } from "./gamesRepository";

type CreateServerOptions = {
  gamesDirectory?: string;
  uploadsDir?: string;
  audioAssetsPath?: string;
};

interface AudioUploadRequest extends express.Request {
  generatedAudioId?: string;
}

const defaultUploadsDir = resolve(process.cwd(), "data", "uploads");
const defaultAudioAssetsPath = resolve(process.cwd(), "data", "audio-assets.json");
const mp3UploadRequiredMessage = 'MP3 file is required in multipart field "file".';
const invalidMp3Message = "Only MP3 audio uploads are supported.";

const asyncHandler =
  (handler: express.RequestHandler): express.RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

function createAudioId() {
  return randomUUID();
}

function isAcceptedMp3(file: Express.Multer.File) {
  return (
    file.mimetype === "audio/mpeg" ||
    file.mimetype === "audio/mp3" ||
    file.originalname.toLowerCase().endsWith(".mp3")
  );
}

function titleFromUpload(file: Express.Multer.File, formTitle: unknown) {
  const title = typeof formTitle === "string" ? formTitle.trim() : "";

  if (title) {
    return title;
  }

  const filename = basename(file.originalname);
  const extension = extname(filename);

  return extension.toLowerCase() === ".mp3"
    ? filename.slice(0, -extension.length)
    : filename;
}

export function createServer(options: CreateServerOptions = {}) {
  const app = express();
  const gamesRepository = new GamesRepository(options.gamesDirectory);
  const uploadsDir = options.uploadsDir ?? defaultUploadsDir;
  const audioAssetsPath = options.audioAssetsPath ?? defaultAudioAssetsPath;

  mkdirSync(uploadsDir, { recursive: true });

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
      if (isAcceptedMp3(file)) {
        callback(null, true);
        return;
      }

      callback(new Error(invalidMp3Message));
    },
    storage: multer.diskStorage({
      destination: (_request, _file, callback) => {
        callback(null, uploadsDir);
      },
      filename: (request: AudioUploadRequest, _file, callback) => {
        const audioId = createAudioId();
        request.generatedAudioId = audioId;
        callback(null, `${audioId}.mp3`);
      }
    })
  });

  function handleAudioUpload(statusCode: 200 | 201): express.RequestHandler {
    return (request: AudioUploadRequest, response) => {
      upload.single("file")(request, response, (error: unknown) => {
        if (error) {
          response.status(400).json({
            error:
              error instanceof Error && error.message === invalidMp3Message
                ? invalidMp3Message
                : mp3UploadRequiredMessage
          });
          return;
        }

        if (!request.file || !request.generatedAudioId) {
          response.status(400).json({ error: mp3UploadRequiredMessage });
          return;
        }

        const title = titleFromUpload(request.file, request.body.title ?? request.body.displayName);
        const asset: AudioAsset = {
          id: request.generatedAudioId,
          src: `/uploads/${request.generatedAudioId}.mp3`,
          title,
          originalName: request.file.originalname,
          displayName: title,
          mimeType: "audio/mpeg"
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
      response.json(await gamesRepository.list());
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
