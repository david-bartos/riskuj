import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type KeyboardShortcutOptions,
  useKeyboardShortcuts
} from "./useKeyboardShortcuts";

function TestShortcuts(options: KeyboardShortcutOptions) {
  useKeyboardShortcuts(options);

  return (
    <div>
      <input aria-label="input field" />
      <textarea aria-label="textarea field" />
      <select aria-label="select field">
        <option value="one">One</option>
      </select>
      <div contentEditable aria-label="editable region" suppressContentEditableWarning>
        Editable region
        <span>Nested editable text</span>
      </div>
    </div>
  );
}

describe("useKeyboardShortcuts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches supported keys to their matching callbacks", () => {
    const onBackToBoard = vi.fn();
    const onToggleAudio = vi.fn();
    const onRevealAnswer = vi.fn();

    render(
      <TestShortcuts
        onBackToBoard={onBackToBoard}
        onToggleAudio={onToggleAudio}
        onRevealAnswer={onRevealAnswer}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "Space" });
    fireEvent.keyDown(window, { key: "a" });
    fireEvent.keyDown(window, { key: "A", shiftKey: true });

    expect(onBackToBoard).toHaveBeenCalledTimes(1);
    expect(onToggleAudio).toHaveBeenCalledTimes(2);
    expect(onRevealAnswer).toHaveBeenCalledTimes(2);
  });

  it("only registers shortcuts with provided callbacks", () => {
    const onRevealAnswer = vi.fn();

    render(<TestShortcuts onRevealAnswer={onRevealAnswer} />);

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "a" });

    expect(onRevealAnswer).toHaveBeenCalledTimes(1);
  });

  it("prevents default browser behavior when handling the space shortcut", () => {
    const onToggleAudio = vi.fn();

    render(<TestShortcuts onToggleAudio={onToggleAudio} />);

    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true
    });

    const wasNotCanceled = window.dispatchEvent(event);

    expect(onToggleAudio).toHaveBeenCalledTimes(1);
    expect(wasNotCanceled).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not dispatch shortcuts when disabled", () => {
    const onBackToBoard = vi.fn();
    const onToggleAudio = vi.fn();
    const onRevealAnswer = vi.fn();

    render(
      <TestShortcuts
        enabled={false}
        onBackToBoard={onBackToBoard}
        onToggleAudio={onToggleAudio}
        onRevealAnswer={onRevealAnswer}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "a" });

    expect(onBackToBoard).not.toHaveBeenCalled();
    expect(onToggleAudio).not.toHaveBeenCalled();
    expect(onRevealAnswer).not.toHaveBeenCalled();
  });

  it("ignores shortcuts from editable fields and content-editable descendants", () => {
    const onBackToBoard = vi.fn();
    const onToggleAudio = vi.fn();
    const onRevealAnswer = vi.fn();

    render(
      <TestShortcuts
        onBackToBoard={onBackToBoard}
        onToggleAudio={onToggleAudio}
        onRevealAnswer={onRevealAnswer}
      />
    );

    fireEvent.keyDown(screen.getByLabelText("input field"), { key: "Escape" });
    fireEvent.keyDown(screen.getByLabelText("textarea field"), { key: " " });
    fireEvent.keyDown(screen.getByLabelText("select field"), { key: "a" });
    fireEvent.keyDown(screen.getByLabelText("editable region"), { key: "a" });
    fireEvent.keyDown(screen.getByText("Nested editable text"), { key: "a" });

    expect(onBackToBoard).not.toHaveBeenCalled();
    expect(onToggleAudio).not.toHaveBeenCalled();
    expect(onRevealAnswer).not.toHaveBeenCalled();
  });

  it("ignores shortcuts with ctrl, meta, or alt modifiers", () => {
    const onBackToBoard = vi.fn();
    const onToggleAudio = vi.fn();
    const onRevealAnswer = vi.fn();

    render(
      <TestShortcuts
        onBackToBoard={onBackToBoard}
        onToggleAudio={onToggleAudio}
        onRevealAnswer={onRevealAnswer}
      />
    );

    fireEvent.keyDown(window, { key: "Escape", ctrlKey: true });
    fireEvent.keyDown(window, { key: " ", metaKey: true });
    fireEvent.keyDown(window, { key: "a", altKey: true });

    expect(onBackToBoard).not.toHaveBeenCalled();
    expect(onToggleAudio).not.toHaveBeenCalled();
    expect(onRevealAnswer).not.toHaveBeenCalled();
  });

  it("does not register a global listener when no shortcuts are available", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");

    render(<TestShortcuts />);

    expect(addEventListener).not.toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("cleans up the global listener on unmount", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const onBackToBoard = vi.fn();

    const { unmount } = render(<TestShortcuts onBackToBoard={onBackToBoard} />);

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });
});
