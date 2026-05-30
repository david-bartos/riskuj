import { existsSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "./index";

const mp3Bytes = Buffer.from("ID3 test mp3 payload");

describe("server", () => {
  let uploadsDir: string;

  beforeEach(async () => {
    uploadsDir = await fs.mkdtemp(join(tmpdir(), "riskuj-uploads-"));
  });

  afterEach(async () => {
    await fs.rm(uploadsDir, { force: true, recursive: true });
  });

  it("vrací JSON stav aplikace na /api/health", async () => {
    const app = createServer({ uploadsDir });

    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("uloží MP3 upload a vrátí AudioAsset", async () => {
    const app = createServer({ uploadsDir });

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
    const app = createServer({ uploadsDir });

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
    const app = createServer({ uploadsDir });

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
    const app = createServer({ uploadsDir });

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
    const app = createServer({ uploadsDir });

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
    const app = createServer({ uploadsDir });

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
    const app = createServer({ uploadsDir });

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
