import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { demoGame } from "../src/data/demoGame";
import { createServer } from "./index";

async function createTestApp() {
  const dataDir = await mkdtemp(path.join(tmpdir(), "riskuj-api-"));
  return createServer({ dataDir });
}

describe("server", () => {
  it("vrací JSON stav aplikace na /api/health", async () => {
    const app = await createTestApp();

    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("uloží a znovu načte hru včetně neutrálních audio metadat", async () => {
    const app = await createTestApp();

    await request(app).put(`/api/games/${demoGame.id}`).send(demoGame).expect(200);
    const response = await request(app)
      .get(`/api/games/${demoGame.id}`)
      .expect(200);

    expect(response.body.id).toBe(demoGame.id);
    expect(response.body.rounds[0].type).toBe("question");
    expect(JSON.stringify(response.body)).toContain("originalName");
    expect(JSON.stringify(response.body)).not.toContain("\"title\":\"Ukázka");
  });

  it("nahraje MP3 asset, zařadí ho do knihovny a servíruje stabilní URL", async () => {
    const app = await createTestApp();

    const uploadResponse = await request(app)
      .post("/api/audio-assets")
      .attach("file", Buffer.from("fake mp3 bytes"), {
        filename: "intro.mp3",
        contentType: "audio/mpeg"
      })
      .expect(201);

    expect(uploadResponse.body).toMatchObject({
      originalName: "intro.mp3",
      mimeType: "audio/mpeg"
    });
    expect(uploadResponse.body.src).toMatch(/^\/uploads\/.+\.mp3$/);

    const listResponse = await request(app).get("/api/audio-assets").expect(200);
    expect(listResponse.body).toEqual([uploadResponse.body]);

    await request(app).get(uploadResponse.body.src).expect(200);
  });

  it("odmítne ne-MP3 upload", async () => {
    const app = await createTestApp();

    await request(app)
      .post("/api/audio-assets")
      .attach("file", Buffer.from("not audio"), {
        filename: "notes.txt",
        contentType: "text/plain"
      })
      .expect(400);
  });
});
