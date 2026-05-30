import express from "express";
import multer from "multer";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Game } from "../src/types/game";
import { createEmptyGame, GameValidationError, assertValidGame } from "./gameValidation";
import { GamesRepository, isSafeGameId } from "./gamesRepository";

type CreateServerOptions = {
  gamesDirectory?: string;
  uploadsDir?: string;
};

interface AudioUploadRequest extends express.Request {
  generatedAudioId?: string;
}

const defaultUploadsDir = resolve(process.cwd(), "data", "uploads");
const mp3UploadRequiredMessage = 'MP3 file is required in multipart field "file".';
const invalidMp3Message = "Only MP3 audio uploads are supported.";

const asyncHandler =
  (handler: express.RequestHandler): express.RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

function createAudioId() {
  return `audio-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

function isAcceptedMp3(file: Express.Multer.File) {
  return (
    file.mimetype === "audio/mpeg" ||
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

  mkdirSync(uploadsDir, { recursive: true });

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
      },
    }),
  });

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

  app.post("/api/uploads/audio", (request: AudioUploadRequest, response) => {
    upload.single("file")(request, response, (error: unknown) => {
      if (error) {
        response.status(400).json({
          error:
            error instanceof Error && error.message === invalidMp3Message
              ? invalidMp3Message
              : mp3UploadRequiredMessage,
        });
        return;
      }

      if (!request.file || !request.generatedAudioId) {
        response.status(400).json({ error: mp3UploadRequiredMessage });
        return;
      }

      response.json({
        id: request.generatedAudioId,
        src: `/uploads/${request.generatedAudioId}.mp3`,
        title: titleFromUpload(request.file, request.body.title),
      });
    });
  });

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
