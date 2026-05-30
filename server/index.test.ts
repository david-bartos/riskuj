import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Game } from "../src/types/game";
import { createServer } from "./index";
import { GamesRepository } from "./gamesRepository";

let gamesDirectory: string;

const savedGame: Game = {
  id: "ulozena-hra",
  title: "Uložená hra",
  teams: [{ id: "team-a", name: "Tým A" }],
  rounds: [],
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T11:00:00.000Z"
};

describe("server", () => {
  beforeEach(async () => {
    gamesDirectory = await mkdtemp(path.join(tmpdir(), "riskuj-api-"));
  });

  afterEach(async () => {
    await rm(gamesDirectory, { recursive: true, force: true });
  });

  it("vrací JSON stav aplikace na /api/health", async () => {
    const app = createServer({ gamesDirectory });

    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("vrátí seznam uložených her", async () => {
    const repository = new GamesRepository(gamesDirectory);
    await repository.save(savedGame);
    const app = createServer({ gamesDirectory });

    const response = await request(app).get("/api/games").expect(200);

    expect(response.body).toEqual([
      {
        id: "ulozena-hra",
        title: "Uložená hra",
        updatedAt: "2026-05-30T11:00:00.000Z",
        roundCount: 0
      }
    ]);
  });

  it("načte detail hry podle ID", async () => {
    const repository = new GamesRepository(gamesDirectory);
    await repository.save(savedGame);
    const app = createServer({ gamesDirectory });

    const response = await request(app).get("/api/games/ulozena-hra").expect(200);

    expect(response.body).toEqual(savedGame);
  });

  it("vrátí českou 404 pro chybějící hru", async () => {
    const app = createServer({ gamesDirectory });

    const response = await request(app).get("/api/games/chybi").expect(404);

    expect(response.body).toEqual({ message: "Hra nebyla nalezena." });
  });

  it("vytvoří prázdnou hru z názvu", async () => {
    const app = createServer({ gamesDirectory });

    const response = await request(app)
      .post("/api/games")
      .send({ title: "Nová testovací hra" })
      .expect(201);

    expect(response.body).toMatchObject({
      title: "Nová testovací hra",
      teams: [],
      rounds: []
    });
    expect(response.body.id).toMatch(/^nova-testovaci-hra-[a-z0-9]+$/);
    expect(response.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(response.body.updatedAt).toBe(response.body.createdAt);
  });

  it("uloží validní kompletní hru přes POST", async () => {
    const app = createServer({ gamesDirectory });

    const response = await request(app).post("/api/games").send(savedGame).expect(201);

    expect(response.body).toEqual(savedGame);
  });

  it("odmítne kompletní POST payload s nebezpečným ID jako validační chybu", async () => {
    const app = createServer({ gamesDirectory });

    const response = await request(app)
      .post("/api/games")
      .send({ ...savedGame, id: "spatne.id" })
      .expect(400);

    expect(response.body).toEqual({
      message: "Hru se nepodařilo uložit.",
      details: ["ID hry smí obsahovat jen písmena, číslice, pomlčku a podtržítko."]
    });
  });

  it("uloží změnu hry přes PUT a aktualizuje updatedAt", async () => {
    const repository = new GamesRepository(gamesDirectory);
    await repository.save(savedGame);
    const app = createServer({ gamesDirectory });

    const response = await request(app)
      .put("/api/games/ulozena-hra")
      .send({ ...savedGame, title: "Přejmenovaná hra" })
      .expect(200);

    expect(response.body.title).toBe("Přejmenovaná hra");
    expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
      new Date(savedGame.updatedAt).getTime()
    );
  });

  it("odmítne PUT s rozdílným ID v adrese a těle", async () => {
    const app = createServer({ gamesDirectory });

    const response = await request(app)
      .put("/api/games/jedna")
      .send({ ...savedGame, id: "druha" })
      .expect(400);

    expect(response.body).toEqual({
      message: "Hru se nepodařilo uložit.",
      details: ["ID hry v adrese neodpovídá tělu požadavku."]
    });
  });

  it("odmítne nevalidní payload s českými detaily", async () => {
    const app = createServer({ gamesDirectory });

    const response = await request(app)
      .post("/api/games")
      .send({ id: "", title: "", teams: [], rounds: [] })
      .expect(400);

    expect(response.body.message).toBe("Hru se nepodařilo uložit.");
    expect(response.body.details).toContain("ID hry musí být neprázdný text.");
    expect(response.body.details).toContain("Název hry musí být neprázdný text.");
  });
});
