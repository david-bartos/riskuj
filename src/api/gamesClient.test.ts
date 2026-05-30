import { afterEach, describe, expect, it, vi } from "vitest";
import { demoGame } from "../data/demoGame";
import { gamesClient } from "./gamesClient";

describe("gamesClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pri nedostupnem API nacte demo hru z lokalni zalohy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(gamesClient.loadGame(demoGame.id)).resolves.toMatchObject({
      id: demoGame.id,
      title: demoGame.title
    });
  });
});
