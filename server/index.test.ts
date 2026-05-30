import { existsSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Game } from "../src/types/game";
import { createServer } from "./index";
import { GamesRepository } from "./gamesRepository";

let gamesDirectory: string;
let uploadsDir: string;

const savedGame: Game = {
  id: "ulozena-hra",
  title: "Uložená hra",
  teams: [{ id: "team-a", name: "Tým A" }],
  rounds: [],
  categories: [],
  questions: [],
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T11:00:00.000Z"
};

const mp3Bytes = Buffer.from("ID3 test mp3 payload");

describe("server", () => {
  beforeEach(async () => {
    gamesDirectory = await fs.mkdtemp(join(tmpdir(), "riskuj-api-"));
    uploadsDir = await fs.mkdtemp(join(tmpdir(), "riskuj-uploads-"));
  });

  afterEach(async () => {
    await fs.rm(gamesDirectory, { force: true, recursive: true });
    await fs.rm(uploadsDir, { force: true, recursive: true });
  });

  it("vrací JSON stav aplikace na /api/health", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("vrátí seznam uložených her", async () => {
    const repository = new GamesRepository(gamesDirectory);
    await repository.save(savedGame);
    const app = createServer({ gamesDirectory, uploadsDir });

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
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app).get("/api/games/ulozena-hra").expect(200);

    expect(response.body).toEqual(savedGame);
  });

  it("vrátí českou 404 pro chybějící hru", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app).get("/api/games/chybi").expect(404);

    expect(response.body).toEqual({ message: "Hra nebyla nalezena." });
  });

  it("vytvoří prázdnou hru z názvu", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/games")
      .send({ title: "Nová testovací hra" })
      .expect(201);

    expect(response.body).toMatchObject({
      title: "Nová testovací hra",
      teams: [],
      rounds: [],
      categories: [],
      questions: []
    });
    expect(response.body.id).toMatch(/^nova-testovaci-hra-[a-z0-9]+$/);
    expect(response.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(response.body.updatedAt).toBe(response.body.createdAt);
  });

  it("uloží validní kompletní hru přes POST", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app).post("/api/games").send(savedGame).expect(201);

    expect(response.body).toEqual(savedGame);
  });

  it("odmítne kompletní POST payload s nebezpečným ID jako validační chybu", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

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
    const app = createServer({ gamesDirectory, uploadsDir });

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
    const app = createServer({ gamesDirectory, uploadsDir });

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
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/games")
      .send({ id: "", title: "", teams: [], rounds: [], categories: [], questions: [] })
      .expect(400);

    expect(response.body.message).toBe("Hru se nepodařilo uložit.");
    expect(response.body.details).toContain("ID hry musí být neprázdný text.");
    expect(response.body.details).toContain("Název hry musí být neprázdný text.");
  });

  it("uloží MP3 upload a vrátí AudioAsset", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/uploads/audio")
      .field("title", "Znělka finále")
      .attach("file", mp3Bytes, {
        contentType: "audio/mpeg",
        filename: "finale.mp3",
      })
      .expect(200);

    expect(response.body).toEqual({
      id: expect.stringMatching(/^audio-\d+-[a-f0-9]+$/),
      src: expect.stringMatching(/^\/uploads\/audio-\d+-[a-f0-9]+\.mp3$/),
      title: "Znělka finále",
    });

    const savedFilename = basename(response.body.src);
    const savedPath = join(uploadsDir, savedFilename);
    expect(existsSync(savedPath)).toBe(true);
    await expect(fs.readFile(savedPath)).resolves.toEqual(mp3Bytes);
  });

  it("přijme soubor s příponou .mp3 i při obecnějším MIME typu", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/uploads/audio")
      .attach("file", mp3Bytes, {
        contentType: "application/octet-stream",
        filename: "intro.MP3",
      })
      .expect(200);

    expect(response.body.title).toBe("intro");
    expect(response.body.src).toMatch(/^\/uploads\/audio-\d+-[a-f0-9]+\.mp3$/);
    expect(existsSync(join(uploadsDir, basename(response.body.src)))).toBe(true);
  });

  it("odvodí title z názvu souboru, když title chybí nebo je prázdný", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/uploads/audio")
      .field("title", "   ")
      .attach("file", mp3Bytes, {
        contentType: "audio/mpeg",
        filename: "ceske-hity.mp3",
      })
      .expect(200);

    expect(response.body.title).toBe("ceske-hity");
  });

  it("vrátí 400 JSON error, když chybí soubor", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/uploads/audio")
      .field("title", "Bez souboru")
      .expect(400);

    expect(response.body).toEqual({
      error: 'MP3 file is required in multipart field "file".',
    });
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("vrátí 400 JSON error pro jiný než MP3 upload", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/uploads/audio")
      .attach("file", Buffer.from("not audio"), {
        contentType: "text/plain",
        filename: "notes.txt",
      })
      .expect(400);

    expect(response.body).toEqual({
      error: "Only MP3 audio uploads are supported.",
    });
    await expect(fs.readdir(uploadsDir)).resolves.toEqual([]);
  });

  it("vrátí 400 JSON error pro neočekávané multipart pole", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const response = await request(app)
      .post("/api/uploads/audio")
      .attach("audio", mp3Bytes, {
        contentType: "audio/mpeg",
        filename: "wrong-field.mp3",
      })
      .expect(400);

    expect(response.body).toEqual({
      error: 'MP3 file is required in multipart field "file".',
    });
    await expect(fs.readdir(uploadsDir)).resolves.toEqual([]);
  });

  it("zpřístupní uložený upload přes vrácené src", async () => {
    const app = createServer({ gamesDirectory, uploadsDir });

    const uploadResponse = await request(app)
      .post("/api/uploads/audio")
      .attach("file", mp3Bytes, {
        contentType: "audio/mpeg",
        filename: "playback.mp3",
      })
      .expect(200);

    const assetResponse = await request(app).get(uploadResponse.body.src).expect(200);

    expect(assetResponse.headers["content-type"]).toContain("audio/mpeg");
    expect(assetResponse.body).toEqual(mp3Bytes);
  });
});
