import { Blob, File as NodeFile } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

Object.defineProperties(globalThis, {
  Blob: { configurable: true, value: Blob },
  File: { configurable: true, value: NodeFile }
});
Object.defineProperties(window, {
  Blob: { configurable: true, value: Blob },
  File: { configurable: true, value: NodeFile }
});

const { FormData: NodeFormData, Request: NodeRequest } = await import("undici");
const { default: worker } = await import("./index");

function createEnv() {
  const statement = {
    bind: vi.fn(),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({}),
    all: vi.fn().mockResolvedValue({ results: [] })
  };
  statement.bind.mockReturnValue(statement);

  return {
    env: {
      DB: {
        prepare: vi.fn().mockReturnValue(statement),
        batch: vi.fn().mockResolvedValue([])
      },
      UPLOADS: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue({})
      }
    },
    statement
  };
}

async function upload(file: NodeFile, env: ReturnType<typeof createEnv>["env"]) {
  const body = new NodeFormData();
  body.append("file", file);
  const request = new NodeRequest("https://riskuj.test/api/uploads/audio", {
    method: "POST",
    body
  });
  return worker.fetch(request as unknown as Request, env);
}

describe("produkční Worker upload", () => {
  it("odmítne WAV bez zápisu do R2 ani metadat", async () => {
    const { env, statement } = createEnv();
    const response = await upload(
      new NodeFile(["RIFF"], "effect.wav", { type: "audio/wav" }),
      env
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Only MP3 audio uploads are supported."
    });
    expect(env.UPLOADS.put).not.toHaveBeenCalled();
    expect(statement.run).not.toHaveBeenCalled();
  });

  it("odmítne MP3 nad 12 MB bez zápisu do R2 ani metadat", async () => {
    const { env, statement } = createEnv();
    const response = await upload(
      new NodeFile(
        [new Uint8Array(12_000_001)],
        "large.mp3",
        { type: "audio/mpeg" }
      ),
      env
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "MP3 file must not exceed 12 MB."
    });
    expect(env.UPLOADS.put).not.toHaveBeenCalled();
    expect(statement.run).not.toHaveBeenCalled();
  });
});
