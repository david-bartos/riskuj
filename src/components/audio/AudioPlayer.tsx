import { useEffect, useRef, useState } from "react";
import type { AudioAsset } from "../../types/game";

export interface AudioPlayerProps {
  audio?: AudioAsset;
  className?: string;
}

const unavailableMessage = "Audio ukázka není k dispozici.";
const playbackErrorMessage =
  "Audio se nepodařilo přehrát. Zkuste pokračovat bez ukázky.";

export function AudioPlayer({ audio, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const src = audio?.src.trim() ?? "";
  const isAvailable = src.length > 0;
  const isDisabled = !isAvailable || hasError;
  const rootClassName = ["audio-player", className].filter(Boolean).join(" ");

  useEffect(() => {
    setIsPlaying(false);
    setHasError(false);
  }, [src]);

  async function handleTogglePlayback() {
    const audioElement = audioRef.current;

    if (!audioElement || isDisabled) {
      return;
    }

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioElement.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setHasError(true);
    }
  }

  function handlePlaybackStopped() {
    setIsPlaying(false);
  }

  function handlePlaybackError() {
    setIsPlaying(false);
    setHasError(true);
  }

  return (
    <section className={rootClassName} aria-label="Audio ukázka">
      <div className="audio-player__content">
        <p className="audio-player__title">
          {isAvailable ? audio?.title : "Audio ukázka"}
        </p>
        <button
          className="audio-player__button"
          type="button"
          disabled={isDisabled}
          onClick={handleTogglePlayback}
        >
          {isPlaying ? "Pozastavit ukázku" : "Přehrát ukázku"}
        </button>
        {!isAvailable ? (
          <p className="audio-player__message">{unavailableMessage}</p>
        ) : null}
        {hasError ? (
          <p className="audio-player__message" role="status">
            {playbackErrorMessage}
          </p>
        ) : null}
      </div>

      {isAvailable ? (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onEnded={handlePlaybackStopped}
          onError={handlePlaybackError}
        />
      ) : null}
    </section>
  );
}
