import { useCallback, useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";

type FullscreenControls = {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
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
  const [fullscreenElement, setFullscreenElement] = useState<Element | null>(() =>
    typeof document === "undefined" ? null : document.fullscreenElement
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenElement(document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(() => {
    const element = targetRef?.current ?? document.documentElement;

    if (!element.requestFullscreen) {
      return;
    }

    safelyRunFullscreen(() => element.requestFullscreen());
  }, [targetRef]);

  const exitFullscreen = useCallback(() => {
    if (!document.fullscreenElement || !document.exitFullscreen) {
      return;
    }

    safelyRunFullscreen(() => document.exitFullscreen());
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      exitFullscreen();
      return;
    }

    enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  const fullscreenTarget = targetRef?.current ?? document.documentElement;
  const isSupported = Boolean(
    fullscreenTarget.requestFullscreen && document.exitFullscreen
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
