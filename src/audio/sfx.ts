import type { AudioAsset } from "../types/game";

export type SfxName = "open" | "correct" | "wrong" | "timeout";

const sfxFiles: Record<SfxName, string> = {
  open: "/sfx/open.mp3",
  correct: "/sfx/correct.mp3",
  wrong: "/sfx/wrong.mp3",
  timeout: "/sfx/timeout.mp3"
};

function resolveSfxSource(source: AudioAsset | SfxName | string | undefined): string {
  if (!source) {
    return "";
  }

  if (typeof source === "object") {
    return source.src;
  }

  return sfxFiles[source as SfxName] ?? source;
}

export function playSfx(source: AudioAsset | SfxName | string | undefined): void {
  try {
    if (typeof Audio === "undefined") {
      return;
    }

    const src = resolveSfxSource(source);
    if (!src) {
      return;
    }

    const audio = new Audio(src);
    const playResult = audio.play();

    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {
        // Autoplay restrictions and missing files must not interrupt the presenter.
      });
    }
  } catch {
    // Unsupported audio APIs or synchronous playback failures are safe no-ops.
  }
}
