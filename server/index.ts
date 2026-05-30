import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { demoGame } from "../src/data/demoGame";
import type { AudioAsset, Game } from "../src/types/game";

type ServerOptions = {
  dataDir?: string;
};

const gameIdPattern = /^[A-Za-z0-9_-]+$/;

function isSafeGameId(id: string) {
  return gameIdPattern.test(id);
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function isGame(value: unknown): value is Game {
  const game = value as Partial<Game>;
  return (
    typeof game?.id === "string" &&
    typeof game.title === "string" &&
    Array.isArray(game.teams) &&
    Array.isArray(game.rounds)
  );
}

function sanitizeMp3FileName(originalName: string) {
  const parsed = path.parse(originalName);
  const baseName = parsed.name
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return `${baseName || "audio"}.mp3`;
}

export function createServer(options: ServerOptions = {}) {
  const app = express();
  const dataDir = options.dataDir ?? path.join(process.cwd(), "server", "data");
  const gamesDir = path.join(dataDir, "games");
  const uploadsDir = path.join(dataDir, "uploads");
  const audioManifestPath = path.join(dataDir, "audio-assets.json");

  mkdirSync(gamesDir, { recursive: true });
  mkdirSync(uploadsDir, { recursive: true });

  const readAudioAssets = () =>
    readJsonFile<AudioAsset[]>(audioManifestPath, []);
  const writeAudioAssets = (assets: AudioAsset[]) =>
    writeJsonFile(audioManifestPath, assets);

  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, uploadsDir);
    },
    filename: (_request, file, callback) => {
      callback(
        null,
        `${crypto.randomUUID()}-${sanitizeMp3FileName(file.originalname)}`
      );
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024
    },
    fileFilter: (_request, file, callback) => {
      const isMp3 =
        file.mimetype === "audio/mpeg" ||
        file.mimetype === "audio/mp3" ||
        file.originalname.toLowerCase().endsWith(".mp3");

      if (!isMp3) {
        callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
        return;
      }

      callback(null, true);
    }
  });

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/games", async (_request, response, next) => {
    try {
      const fileNames = existsSync(gamesDir) ? await readdir(gamesDir) : [];
      const games = await Promise.all(
        fileNames
          .filter((fileName) => fileName.endsWith(".json"))
          .map((fileName) =>
            readJsonFile<Game | null>(path.join(gamesDir, fileName), null)
          )
      );

      response.json(games.filter((game): game is Game => Boolean(game)));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/games/:gameId", async (request, response, next) => {
    try {
      const { gameId } = request.params;
      if (!isSafeGameId(gameId)) {
        response.status(400).json({ error: "Invalid game id" });
        return;
      }

      const gamePath = path.join(gamesDir, `${gameId}.json`);
      const storedGame = await readJsonFile<Game | null>(gamePath, null);
      if (storedGame) {
        response.json(storedGame);
        return;
      }

      if (gameId === demoGame.id || gameId === "demo") {
        response.json(demoGame);
        return;
      }

      response.status(404).json({ error: "Game not found" });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/games/:gameId", async (request, response, next) => {
    try {
      const { gameId } = request.params;
      if (!isSafeGameId(gameId)) {
        response.status(400).json({ error: "Invalid game id" });
        return;
      }

      if (!isGame(request.body)) {
        response.status(400).json({ error: "Invalid game payload" });
        return;
      }

      if (request.body.id !== gameId) {
        response.status(400).json({ error: "Game id mismatch" });
        return;
      }

      const gamePath = path.join(gamesDir, `${gameId}.json`);
      await writeJsonFile(gamePath, request.body);
      response.json(request.body);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/audio-assets", async (_request, response, next) => {
    try {
      response.json(await readAudioAssets());
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/audio-assets",
    upload.single("file"),
    async (request, response, next) => {
      try {
        if (!request.file) {
          response.status(400).json({ error: "Missing MP3 file" });
          return;
        }

        const asset: AudioAsset = {
          id: crypto.randomUUID(),
          src: `/uploads/${request.file.filename}`,
          originalName: request.file.originalname,
          displayName:
            typeof request.body.displayName === "string" &&
            request.body.displayName.trim()
              ? request.body.displayName.trim()
              : request.file.originalname,
          mimeType: "audio/mpeg"
        };

        const assets = await readAudioAssets();
        await writeAudioAssets([...assets, asset]);
        response.status(201).json(asset);
      } catch (error) {
        next(error);
      }
    }
  );

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction
    ) => {
      if (error instanceof multer.MulterError) {
        response.status(400).json({ error: "Only MP3 uploads are supported" });
        return;
      }

      next(error);
    }
  );

  return app;
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
