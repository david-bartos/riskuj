import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "./AudioPlayer";
import type { AudioAsset } from "../../types/game";

const demoAudio: AudioAsset = {
  id: "intro-riff",
  src: "/uploads/intro-riff.mp3",
  title: "Úvodní riff",
  durationSeconds: 12
};

function mockMediaMethods({
  playResult = Promise.resolve()
}: {
  playResult?: Promise<void>;
} = {}) {
  const play = vi
    .spyOn(window.HTMLMediaElement.prototype, "play")
    .mockReturnValue(playResult);
  const pause = vi
    .spyOn(window.HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => undefined);

  return { play, pause };
}

describe("AudioPlayer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("zobrazí velkou akci pro přehrání dostupné audio ukázky", () => {
    render(<AudioPlayer audio={demoAudio} />);

    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeEnabled();
    expect(screen.getByText("Úvodní riff")).toBeInTheDocument();

    const audio = document.querySelector("audio");
    expect(audio).toHaveAttribute("src", "/uploads/intro-riff.mp3");
    expect(audio).toHaveAttribute("preload", "metadata");
  });

  it("zobrazí stabilní informační stav, když audio chybí", () => {
    render(<AudioPlayer />);

    expect(
      screen.getByText("Audio ukázka není k dispozici.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeDisabled();
    expect(document.querySelector("audio")).not.toBeInTheDocument();
  });

  it("zobrazí stabilní informační stav, když audio nemá zdroj", () => {
    render(<AudioPlayer audio={{ ...demoAudio, src: "" }} />);

    expect(
      screen.getByText("Audio ukázka není k dispozici.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeDisabled();
  });

  it("přepíná mezi přehráním a pozastavením", async () => {
    const { play, pause } = mockMediaMethods();
    render(<AudioPlayer audio={demoAudio} />);

    fireEvent.click(screen.getByRole("button", { name: "Přehrát ukázku" }));

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("button", { name: "Pozastavit ukázku" })
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Pozastavit ukázku" })
    );

    expect(pause).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeEnabled();
  });

  it("po dohrání vrátí ovládání do stavu přehrání", async () => {
    mockMediaMethods();
    render(<AudioPlayer audio={demoAudio} />);

    fireEvent.click(screen.getByRole("button", { name: "Přehrát ukázku" }));
    await screen.findByRole("button", { name: "Pozastavit ukázku" });

    const audio = document.querySelector("audio");
    expect(audio).not.toBeNull();
    fireEvent.ended(audio as HTMLAudioElement);

    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeEnabled();
  });

  it("zobrazí českou fallback zprávu při chybě načtení audia", () => {
    render(<AudioPlayer audio={demoAudio} />);

    const audio = document.querySelector("audio");
    expect(audio).not.toBeNull();
    fireEvent.error(audio as HTMLAudioElement);

    expect(
      screen.getByText(
        "Audio se nepodařilo přehrát. Zkuste pokračovat bez ukázky."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeDisabled();
  });

  it("zobrazí českou fallback zprávu, když prohlížeč odmítne přehrávání", async () => {
    mockMediaMethods({ playResult: Promise.reject(new Error("blocked")) });
    render(<AudioPlayer audio={demoAudio} />);

    fireEvent.click(screen.getByRole("button", { name: "Přehrát ukázku" }));

    expect(
      await screen.findByText(
        "Audio se nepodařilo přehrát. Zkuste pokračovat bez ukázky."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeDisabled();
  });

  it("při změně zdroje vyčistí chybu a vrátí stav přehrání", () => {
    const { rerender } = render(<AudioPlayer audio={demoAudio} />);

    const audio = document.querySelector("audio");
    expect(audio).not.toBeNull();
    fireEvent.error(audio as HTMLAudioElement);
    expect(
      screen.getByText(
        "Audio se nepodařilo přehrát. Zkuste pokračovat bez ukázky."
      )
    ).toBeInTheDocument();

    rerender(
      <AudioPlayer
        audio={{
          id: "second",
          src: "/uploads/second.mp3",
          title: "Druhá ukázka"
        }}
      />
    );

    expect(
      screen.queryByText(
        "Audio se nepodařilo přehrát. Zkuste pokračovat bez ukázky."
      )
    ).not.toBeInTheDocument();
    expect(screen.getByText("Druhá ukázka")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Přehrát ukázku" })
    ).toBeEnabled();
  });
});
