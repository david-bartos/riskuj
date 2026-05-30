import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFullscreen } from "./useFullscreen";

function FullscreenHarness() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { enterFullscreen, exitFullscreen, isFullscreen, isSupported, toggleFullscreen } =
    useFullscreen(targetRef);

  return (
    <div>
      <div ref={targetRef} data-testid="target" />
      <output>{isFullscreen ? "fullscreen" : "windowed"}</output>
      <span>{isSupported ? "supported" : "unsupported"}</span>
      <button type="button" onClick={enterFullscreen}>
        enter
      </button>
      <button type="button" onClick={exitFullscreen}>
        exit
      </button>
      <button type="button" onClick={toggleFullscreen}>
        toggle
      </button>
    </div>
  );
}

describe("useFullscreen", () => {
  const originalFullscreenElement = Object.getOwnPropertyDescriptor(
    document,
    "fullscreenElement"
  );
  const originalExitFullscreen = document.exitFullscreen;
  const originalRequestFullscreen = HTMLDivElement.prototype.requestFullscreen;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFullscreenElement) {
      Object.defineProperty(document, "fullscreenElement", originalFullscreenElement);
    } else {
      Reflect.deleteProperty(document, "fullscreenElement");
    }
    document.exitFullscreen = originalExitFullscreen;
    HTMLDivElement.prototype.requestFullscreen = originalRequestFullscreen;
  });

  it("enters fullscreen for the target element and tracks fullscreenchange", async () => {
    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement
    });
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

    render(<FullscreenHarness />);
    const target = screen.getByTestId("target") as HTMLDivElement;
    target.requestFullscreen = vi.fn().mockImplementation(() => {
      fullscreenElement = target;
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "enter" }));

    await waitFor(() => expect(screen.getByText("fullscreen")).toBeInTheDocument());
    expect(target.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("exits fullscreen safely", async () => {
    let fullscreenElement: Element | null = document.body;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement
    });
    document.exitFullscreen = vi.fn().mockImplementation(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    });

    render(<FullscreenHarness />);

    fireEvent.click(screen.getByRole("button", { name: "exit" }));

    await waitFor(() => expect(screen.getByText("windowed")).toBeInTheDocument());
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it("reports unsupported and no-ops when requestFullscreen is missing", () => {
    HTMLDivElement.prototype.requestFullscreen = undefined as unknown as typeof HTMLElement.prototype.requestFullscreen;
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

    render(<FullscreenHarness />);

    expect(screen.getByText("unsupported")).toBeInTheDocument();
    expect(() => fireEvent.click(screen.getByRole("button", { name: "enter" }))).not.toThrow();
  });

  it("does not throw when fullscreen promises reject", () => {
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null
    });
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

    render(<FullscreenHarness />);
    const target = screen.getByTestId("target") as HTMLDivElement;
    target.requestFullscreen = vi.fn().mockRejectedValue(new Error("denied"));

    expect(() => fireEvent.click(screen.getByRole("button", { name: "enter" }))).not.toThrow();
  });
});
