import { useId, useRef, useState } from "react";
import type { AudioAsset } from "../../types/game";

type AudioUploadFieldProps = {
  audio?: AudioAsset;
  audioAssets: AudioAsset[];
  label: string;
  onChange: (audio: AudioAsset | undefined) => void;
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
};

function getAudioLabel(audio: AudioAsset) {
  return audio.displayName ?? audio.title ?? audio.originalName ?? audio.src;
}

function isMp3File(file: File) {
  return (
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    file.name.toLowerCase().endsWith(".mp3")
  );
}

export default function AudioUploadField({
  audio,
  audioAssets,
  label,
  onChange,
  onUploadAudio
}: AudioUploadFieldProps) {
  const selectId = useId();
  const uploadId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadSequenceRef = useRef(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(file: File | undefined) {
    const uploadSequence = uploadSequenceRef.current + 1;
    uploadSequenceRef.current = uploadSequence;
    setError("");
    setStatus("");

    if (!file) {
      setError("Vyberte prosím MP3 soubor k nahrání.");
      return;
    }

    if (!isMp3File(file)) {
      setError("Nahrajte prosím soubor MP3.");
      return;
    }

    if (!onUploadAudio) {
      setError("Nahrávání audia není dostupné.");
      return;
    }

    setStatus("Nahrávám MP3...");

    try {
      const asset = await onUploadAudio(file);
      if (uploadSequenceRef.current !== uploadSequence) {
        return;
      }
      onChange(asset);
      setStatus("Audio je připojené.");
    } catch (uploadError) {
      if (uploadSequenceRef.current !== uploadSequence) {
        return;
      }
      const message = uploadError instanceof Error ? uploadError.message : "MP3 se nepodařilo nahrát.";
      setStatus("");
      setError(message);
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <section className="audio-attachment" aria-label={label}>
      <div className="editor-grid">
        <label className="field-stack" htmlFor={selectId}>
          <span>Vybrat MP3 z knihovny</span>
          <select
            id={selectId}
            value={audio?.id ?? ""}
            onChange={(event) => {
              uploadSequenceRef.current += 1;
              const asset = audioAssets.find((candidate) => candidate.id === event.target.value);
              onChange(asset);
              setError("");
              setStatus(asset ? "Audio je připojené." : "");
            }}
          >
            <option value="">Bez audia</option>
            {audioAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {getAudioLabel(asset)}
              </option>
            ))}
          </select>
        </label>

        <label className="field-stack" htmlFor={uploadId}>
          <span>Nahrát MP3 k položce</span>
          <input
            accept="audio/mpeg,.mp3"
            id={uploadId}
            ref={inputRef}
            type="file"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
        </label>
      </div>

      {audio ? (
        <div className="audio-preview" aria-label="Aktuální audio">
          <span>Aktuální audio: {getAudioLabel(audio)}</span>
          <audio aria-label="Náhled audio ukázky" controls src={audio.src} />
          <button
            type="button"
            className="button-compact"
            onClick={() => {
              uploadSequenceRef.current += 1;
              onChange(undefined);
            }}
          >
            Odebrat audio
          </button>
        </div>
      ) : null}
      {status ? <p role="status">{status}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
