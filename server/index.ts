import express from "express";
import { pathToFileURL } from "node:url";
import type { Game } from "../src/types/game";
import { createEmptyGame, GameValidationError, assertValidGame } from "./gameValidation";
import { GamesRepository, isSafeGameId } from "./gamesRepository";

type CreateServerOptions = {
  gamesDirectory?: string;
};

const asyncHandler =
  (handler: express.RequestHandler): express.RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export function createServer(options: CreateServerOptions = {}) {
  const app = express();
  const gamesRepository = new GamesRepository(options.gamesDirectory);

  app.use(express.json());

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
