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

  it("zobrazí českou chybu uploadu", async () => {
    const onUploadAudio = vi.fn().mockRejectedValue(new Error("Server spadl."));
    renderField({ onUploadAudio });

    fireEvent.change(screen.getByLabelText("Nahrát MP3 k položce"), {
      target: { files: [new File(["ID3"], "intro.mp3", { type: "audio/mpeg" })] }
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Server spadl.");
  });
});
