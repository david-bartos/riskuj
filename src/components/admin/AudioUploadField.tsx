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

function isSupportedAudioFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return (
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    file.type === "audio/wav" ||
    file.type === "audio/wave" ||
    file.type === "audio/x-wav" ||
    lowerName.endsWith(".mp3") ||
    lowerName.endsWith(".wav")
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
      setError("Vyberte prosím audio soubor k nahrání.");
      return;
    }

    if (!isSupportedAudioFile(file)) {
      setError("Nahrajte prosím soubor MP3 nebo WAV.");
      return;
    }

    setStatus("Nahrávám audio...");

    try {
      const asset = onUploadAudio ? await onUploadAudio(file) : await uploadAudioViaApi(file);
      if (uploadSequenceRef.current !== uploadSequence) {
        return;
      }
      onChange(asset);
      setStatus("Audio je připojené.");
    } catch (uploadError) {
      if (uploadSequenceRef.current !== uploadSequence) {
        return;
      }
      const message = uploadError instanceof Error ? uploadError.message : "Audio se nepodařilo nahrát.";
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
      <h3 className="audio-attachment-title">{label}</h3>
      <div className="editor-grid">
        <label className="field-stack" htmlFor={selectId}>
          <span>Vybrat audio z knihovny</span>
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
          <span>Upload audio</span>
          <input
            accept=".mp3,.wav"
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
          <span>{audio.src}</span>
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

async function uploadAudioViaApi(file: File): Promise<AudioAsset> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/uploads/audio", {
    method: "POST",
    body
  });

  if (!response.ok) {
    throw new Error("Audio se nepodařilo nahrát.");
  }

  return (await response.json()) as AudioAsset;
}
