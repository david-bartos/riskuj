import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GameSessionState } from "../types/game";
import { useGameSession } from "./useGameSession";

const storageKey = (gameId: string) => `riskuj:game-session:${gameId}`;
const storageValues = new Map<string, string>();

const testLocalStorage: Storage = {
  get length() {
    return storageValues.size;
  },
  clear() {
    storageValues.clear();
  },
  getItem(key) {
    return storageValues.get(key) ?? null;
  },
  key(index) {
    return Array.from(storageValues.keys())[index] ?? null;
  },
  removeItem(key) {
    storageValues.delete(key);
  },
  setItem(key, value) {
    storageValues.set(key, value);
  }
};

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: testLocalStorage
});

function readStoredSession(gameId: string): GameSessionState {
  const rawValue = window.localStorage.getItem(storageKey(gameId));

  if (!rawValue) {
    throw new Error(`Expected stored session for ${gameId}`);
  }

  return JSON.parse(rawValue) as GameSessionState;
}

describe("useGameSession", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("initializes a default session when no stored state exists", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    expect(result.current.state).toEqual({
      gameId: "demo",
      revealedQuestionIds: [],
      currentQuestionId: undefined,
      teamScores: {},
      activeTeamId: undefined,
      isFinalized: false
    });
    expect(result.current.currentQuestionId).toBeUndefined();
    expect(result.current.revealedQuestionIds).toEqual([]);
    expect(readStoredSession("demo")).toEqual(result.current.state);
  });

  it("restores compatible stored state for the requested game", () => {
    const storedState: GameSessionState = {
      gameId: "demo",
      revealedQuestionIds: ["q100"],
      currentQuestionId: "q200",
      teamScores: { red: 300 },
      activeTeamId: "red",
      isFinalized: false
    };
    window.localStorage.setItem(storageKey("demo"), JSON.stringify(storedState));

    const { result } = renderHook(() => useGameSession("demo"));

    expect(result.current.state).toEqual(storedState);
    expect(result.current.currentQuestionId).toBe("q200");
    expect(result.current.revealedQuestionIds).toEqual(["q100"]);
  });

  it("keeps sessions isolated by game id", () => {
    window.localStorage.setItem(
      storageKey("other"),
      JSON.stringify({
        gameId: "other",
        revealedQuestionIds: ["other-q"],
        currentQuestionId: "other-current",
        teamScores: { blue: 500 },
        activeTeamId: "blue",
        isFinalized: true
      } satisfies GameSessionState)
    );

    const { result } = renderHook(() => useGameSession("demo"));

    expect(result.current.state.gameId).toBe("demo");
    expect(result.current.revealedQuestionIds).toEqual([]);
    expect(window.localStorage.getItem(storageKey("other"))).not.toBeNull();
    expect(readStoredSession("other").revealedQuestionIds).toEqual(["other-q"]);
  });

  it("selectTile sets the current question without marking it used", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    act(() => {
      result.current.selectTile("q300");
    });

    expect(result.current.currentQuestionId).toBe("q300");
    expect(result.current.state.currentQuestionId).toBe("q300");
    expect(result.current.revealedQuestionIds).toEqual([]);
    expect(readStoredSession("demo").currentQuestionId).toBe("q300");
  });

  it("markQuestionUsed marks the current question when no id is provided", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    act(() => {
      result.current.selectTile("q400");
    });
    act(() => {
      result.current.markQuestionUsed();
    });

    expect(result.current.currentQuestionId).toBe("q400");
    expect(result.current.revealedQuestionIds).toEqual(["q400"]);
    expect(readStoredSession("demo").revealedQuestionIds).toEqual(["q400"]);
  });

  it("markQuestionUsed accepts an explicit question id", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    act(() => {
      result.current.markQuestionUsed("q500");
    });

    expect(result.current.currentQuestionId).toBeUndefined();
    expect(result.current.revealedQuestionIds).toEqual(["q500"]);
    expect(readStoredSession("demo").revealedQuestionIds).toEqual(["q500"]);
  });

  it("markQuestionUsed does not duplicate revealed question ids", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    act(() => {
      result.current.markQuestionUsed("q100");
    });
    act(() => {
      result.current.markQuestionUsed("q100");
    });

    expect(result.current.revealedQuestionIds).toEqual(["q100"]);
    expect(readStoredSession("demo").revealedQuestionIds).toEqual(["q100"]);
  });

  it("markQuestionUsed is a no-op when no id is available", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    act(() => {
      result.current.markQuestionUsed();
    });

    expect(result.current.currentQuestionId).toBeUndefined();
    expect(result.current.revealedQuestionIds).toEqual([]);
    expect(readStoredSession("demo").revealedQuestionIds).toEqual([]);
  });

  it("clearCurrentQuestion clears only the selected question", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    act(() => {
      result.current.selectTile("q200");
    });
    act(() => {
      result.current.markQuestionUsed();
    });
    act(() => {
      result.current.clearCurrentQuestion();
    });

    expect(result.current.currentQuestionId).toBeUndefined();
    expect(result.current.revealedQuestionIds).toEqual(["q200"]);
    expect(readStoredSession("demo").currentQuestionId).toBeUndefined();
    expect(readStoredSession("demo").revealedQuestionIds).toEqual(["q200"]);
  });

  it("falls back to a default session when stored JSON is invalid", () => {
    window.localStorage.setItem(storageKey("demo"), "{not-json");

    const { result } = renderHook(() => useGameSession("demo"));

    expect(result.current.state).toEqual({
      gameId: "demo",
      revealedQuestionIds: [],
      currentQuestionId: undefined,
      teamScores: {},
      activeTeamId: undefined,
      isFinalized: false
    });
    expect(readStoredSession("demo")).toEqual(result.current.state);
  });

  it("resetSession restores and persists the default state", () => {
    const { result } = renderHook(() => useGameSession("demo"));

    act(() => {
      result.current.selectTile("q100");
    });
    act(() => {
      result.current.markQuestionUsed();
    });
    act(() => {
      result.current.resetSession();
    });

    expect(result.current.state).toEqual({
      gameId: "demo",
      revealedQuestionIds: [],
      currentQuestionId: undefined,
      teamScores: {},
      activeTeamId: undefined,
      isFinalized: false
    });
    expect(readStoredSession("demo")).toEqual(result.current.state);
  });
});
