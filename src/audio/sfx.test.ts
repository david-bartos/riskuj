import { afterEach, describe, expect, it, vi } from "vitest";
import { playSfx } from "./sfx";

describe("playSfx", () => {
  const originalAudio = globalThis.Audio;

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.Audio = originalAudio;
  });

  it("plays the mapped SFX file for a known name", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const audioConstructor = vi.fn().mockImplementation((src: string) => ({
      src,
      play
    }));
    globalThis.Audio = audioConstructor as unknown as typeof Audio;

    playSfx("open");

    expect(audioConstructor).toHaveBeenCalledWith("/sfx/open.mp3");
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("does not throw when Audio is unavailable", () => {
    globalThis.Audio = undefined as unknown as typeof Audio;

    expect(() => playSfx("correct")).not.toThrow();
  });

  it("does not throw or leak when play rejects", async () => {
    const play = vi.fn().mockRejectedValue(new Error("autoplay blocked"));
    globalThis.Audio = vi.fn().mockImplementation(() => ({ play })) as unknown as typeof Audio;

    expect(() => playSfx("wrong")).not.toThrow();

    await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("does not throw when constructing audio throws synchronously", () => {
    globalThis.Audio = vi.fn().mockImplementation(() => {
      throw new Error("missing codec");
    }) as unknown as typeof Audio;

    expect(() => playSfx("timeout")).not.toThrow();
  });

  it("does not throw when playing audio throws synchronously", () => {
    globalThis.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn(() => {
        throw new Error("playback unavailable");
      })
    })) as unknown as typeof Audio;

    expect(() => playSfx("timeout")).not.toThrow();
  });
});
