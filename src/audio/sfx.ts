export type SfxName = "open" | "correct" | "wrong" | "timeout";

const sfxFiles: Record<SfxName, string> = {
  open: "/sfx/open.mp3",
  correct: "/sfx/correct.mp3",
  wrong: "/sfx/wrong.mp3",
  timeout: "/sfx/timeout.mp3"
};

export function playSfx(name: SfxName): void {
  try {
    if (typeof Audio === "undefined") {
      return;
    }

    const audio = new Audio(sfxFiles[name]);
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
