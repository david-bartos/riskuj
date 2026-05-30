import { useEffect } from "react";

export type KeyboardShortcutOptions = {
  enabled?: boolean;
  onBackToBoard?: () => void;
  onToggleAudio?: () => void;
  onRevealAnswer?: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  const contentEditableElement = target.closest("[contenteditable]");

  return (
    contentEditableElement !== null &&
    contentEditableElement.getAttribute("contenteditable")?.toLowerCase() !== "false"
  );
}

function hasBlockedModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

export function useKeyboardShortcuts({
  enabled = true,
  onBackToBoard,
  onToggleAudio,
  onRevealAnswer
}: KeyboardShortcutOptions): void {
  useEffect(() => {
    if (!enabled || (!onBackToBoard && !onToggleAudio && !onRevealAnswer)) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (hasBlockedModifier(event) || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        onBackToBoard?.();
        return;
      }

      if (event.key === " " || event.key === "Space") {
        if (onToggleAudio) {
          event.preventDefault();
          onToggleAudio();
        }
        return;
      }

      if (event.key.toLowerCase() === "a") {
        onRevealAnswer?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onBackToBoard, onRevealAnswer, onToggleAudio]);
}
