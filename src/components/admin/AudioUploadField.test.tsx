import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AudioAsset } from "../../types/game";
import AudioUploadField from "./AudioUploadField";

const asset: AudioAsset = {
  id: "audio-1",
  src: "/uploads/audio-1.mp3",
  title: "intro"
};

function renderField(props: Partial<ComponentProps<typeof AudioUploadField>> = {}) {
  const onChange = vi.fn();
  const onUploadAudio = vi.fn().mockResolvedValue(asset);

  render(
    <AudioUploadField
      label="Audio otázky"
      audio={props.audio}
      audioAssets={props.audioAssets ?? []}
      onChange={props.onChange ?? onChange}
      onUploadAudio={props.onUploadAudio ?? onUploadAudio}
    />
  );

  return { onChange, onUploadAudio };
}

describe("AudioUploadField", () => {
  it("zobrazí uložený název a audio náhled", () => {
    renderField({ audio: asset });

    expect(screen.getByRole("region", { name: "Audio otázky" })).toBeInTheDocument();
    expect(screen.getByText("Aktuální audio: intro")).toBeInTheDocument();
    expect(screen.getByLabelText("Náhled audio ukázky")).toHaveAttribute(
      "src",
      "/uploads/audio-1.mp3"
    );
  });

  it("odmítne jiný než MP3 soubor bez volání uploadu", () => {
    const { onUploadAudio } = renderField();
    const input = screen.getByLabelText("Nahrát MP3 k položce");

    fireEvent.change(input, {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] }
    });

    expect(onUploadAudio).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Nahrajte prosím soubor MP3.");
  });

  it("nahraje MP3, zobrazí průběh a předá vrácený AudioAsset", async () => {
    const pendingUpload = new Promise<AudioAsset>((resolve) => {
      setTimeout(() => resolve(asset), 0);
    });
    const onUploadAudio = vi.fn().mockReturnValue(pendingUpload);
    const onChange = vi.fn();
    renderField({ onUploadAudio, onChange });
    const file = new File(["ID3"], "intro.mp3", { type: "audio/mpeg" });

    fireEvent.change(screen.getByLabelText("Nahrát MP3 k položce"), {
      target: { files: [file] }
    });

    expect(screen.getByRole("status")).toHaveTextContent("Nahrávám MP3...");
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(asset));
    expect(onUploadAudio).toHaveBeenCalledWith(file);
    expect(screen.getByRole("status")).toHaveTextContent("Audio je připojené.");
  });

  it("nepřepíše pozdější odebrání audia dokončeným starším uploadem", async () => {
    let finishUpload: (uploadedAsset: AudioAsset) => void = () => undefined;
    const pendingUpload = new Promise<AudioAsset>((resolve) => {
      finishUpload = resolve;
    });
    const onUploadAudio = vi.fn().mockReturnValue(pendingUpload);
    const onChange = vi.fn();
    renderField({ audio: asset, onUploadAudio, onChange });

    fireEvent.change(screen.getByLabelText("Nahrát MP3 k položce"), {
      target: { files: [new File(["ID3"], "older.mp3", { type: "audio/mpeg" })] }
    });
    fireEvent.click(screen.getByRole("button", { name: "Odebrat audio" }));

    finishUpload({
      id: "audio-old",
      src: "/uploads/audio-old.mp3",
      title: "older"
    });

    await waitFor(() => expect(onUploadAudio).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("nepřepíše pozdější výběr z knihovny dokončeným starším uploadem", async () => {
    const libraryAsset: AudioAsset = {
      id: "audio-library",
      src: "/uploads/audio-library.mp3",
      title: "library"
    };
    let finishUpload: (uploadedAsset: AudioAsset) => void = () => undefined;
    const pendingUpload = new Promise<AudioAsset>((resolve) => {
      finishUpload = resolve;
    });
    const onUploadAudio = vi.fn().mockReturnValue(pendingUpload);
    const onChange = vi.fn();
    renderField({ audioAssets: [libraryAsset], onUploadAudio, onChange });

    fireEvent.change(screen.getByLabelText("Nahrát MP3 k položce"), {
      target: { files: [new File(["ID3"], "older.mp3", { type: "audio/mpeg" })] }
    });
    fireEvent.change(screen.getByLabelText("Vybrat MP3 z knihovny"), {
      target: { value: "audio-library" }
    });

    finishUpload({
      id: "audio-old",
      src: "/uploads/audio-old.mp3",
      title: "older"
    });

    await waitFor(() => expect(onUploadAudio).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(libraryAsset);
  });

  it("zobrazí českou chybu uploadu", async () => {
    const onUploadAudio = vi.fn().mockRejectedValue(new Error("Server spadl."));
    renderField({ onUploadAudio });

    fireEvent.change(screen.getByLabelText("Nahrát MP3 k položce"), {
      target: { files: [new File(["ID3"], "intro.mp3", { type: "audio/mpeg" })] }
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Server spadl.");
  });
});
