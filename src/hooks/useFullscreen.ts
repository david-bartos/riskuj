import { useCallback, useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";

type FullscreenControls = {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
};

type RuntimeDocument = Omit<Document, "exitFullscreen"> & {
  exitFullscreen?: () => Promise<void>;
};

type RuntimeFullscreenElement = Omit<HTMLElement, "requestFullscreen"> & {
  requestFullscreen?: () => Promise<void>;
};

function safelyRunFullscreen(promiseFactory: () => Promise<void> | void) {
  try {
    const result = promiseFactory();

    if (result && typeof result.catch === "function") {
      result.catch(() => {
        // Browser policy, user settings, or unsupported targets can deny fullscreen.
      });
    }
  } catch {
    // Fullscreen failures are non-critical in presenter mode.
  }
}

export function useFullscreen<T extends HTMLElement>(
  targetRef?: RefObject<T | null>
): FullscreenControls {
  const fullscreenDocument = document as RuntimeDocument;
  const [fullscreenElement, setFullscreenElement] = useState<Element | null>(() =>
    typeof document === "undefined" ? null : fullscreenDocument.fullscreenElement
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenElement(fullscreenDocument.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(() => {
    const element = (targetRef?.current ?? document.documentElement) as RuntimeFullscreenElement;
    const requestFullscreen = element.requestFullscreen;

    if (!requestFullscreen) {
      return;
    }

    safelyRunFullscreen(() => requestFullscreen.call(element));
  }, [targetRef]);

  const exitFullscreen = useCallback(() => {
    const exitFullscreenMethod = fullscreenDocument.exitFullscreen;

    if (!fullscreenDocument.fullscreenElement || !exitFullscreenMethod) {
      return;
    }

    safelyRunFullscreen(() => exitFullscreenMethod.call(fullscreenDocument));
  }, [fullscreenDocument]);

  const toggleFullscreen = useCallback(() => {
    if (fullscreenDocument.fullscreenElement) {
      exitFullscreen();
      return;
    }

    enterFullscreen();
  }, [enterFullscreen, exitFullscreen, fullscreenDocument]);

  const fullscreenTarget = (targetRef?.current ?? document.documentElement) as RuntimeFullscreenElement;
  const isSupported = Boolean(
    fullscreenTarget.requestFullscreen && fullscreenDocument.exitFullscreen
  );

  return useMemo(
    () => ({
      isFullscreen: Boolean(fullscreenElement),
      isSupported,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen
    }),
    [enterFullscreen, exitFullscreen, fullscreenElement, isSupported, toggleFullscreen]
  );
}
