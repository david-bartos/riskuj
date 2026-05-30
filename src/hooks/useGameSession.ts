import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameSessionState } from "../types/game";

export type UseGameSessionResult = {
  state: GameSessionState;
  currentQuestionId?: string;
  revealedQuestionIds: string[];
  selectTile: (questionId: string) => void;
  markQuestionUsed: (questionId?: string) => void;
  clearCurrentQuestion: () => void;
  resetSession: () => void;
};

const STORAGE_PREFIX = "riskuj:game-session:";

function getStorageKey(gameId: string) {
  return `${STORAGE_PREFIX}${gameId}`;
}

function createDefaultSessionState(gameId: string): GameSessionState {
  return {
    gameId,
    revealedQuestionIds: [],
    currentQuestionId: undefined,
    teamScores: {},
    activeTeamId: undefined,
    isFinalized: false
  };
}

function normalizeSessionState(
  gameId: string,
  storedValue: Partial<GameSessionState> | null
): GameSessionState {
  const defaultState = createDefaultSessionState(gameId);

  if (!storedValue || typeof storedValue !== "object") {
    return defaultState;
  }

  return {
    ...defaultState,
    ...storedValue,
    gameId,
    revealedQuestionIds: Array.isArray(storedValue.revealedQuestionIds)
      ? storedValue.revealedQuestionIds.filter(
          (questionId): questionId is string => typeof questionId === "string"
        )
      : defaultState.revealedQuestionIds,
    currentQuestionId:
      typeof storedValue.currentQuestionId === "string"
        ? storedValue.currentQuestionId
        : defaultState.currentQuestionId,
    teamScores:
      storedValue.teamScores && typeof storedValue.teamScores === "object"
        ? storedValue.teamScores
        : defaultState.teamScores,
    activeTeamId:
      typeof storedValue.activeTeamId === "string"
        ? storedValue.activeTeamId
        : defaultState.activeTeamId,
    isFinalized:
      typeof storedValue.isFinalized === "boolean"
        ? storedValue.isFinalized
        : defaultState.isFinalized
  };
}

function loadSessionState(gameId: string): GameSessionState {
  const rawValue = window.localStorage.getItem(getStorageKey(gameId));

  if (!rawValue) {
    return createDefaultSessionState(gameId);
  }

  try {
    return normalizeSessionState(
      gameId,
      JSON.parse(rawValue) as Partial<GameSessionState>
    );
  } catch {
    return createDefaultSessionState(gameId);
  }
}

export function useGameSession(gameId: string): UseGameSessionResult {
  const storageKey = useMemo(() => getStorageKey(gameId), [gameId]);
  const [state, setState] = useState<GameSessionState>(() =>
    loadSessionState(gameId)
  );

  useEffect(() => {
    setState(loadSessionState(gameId));
  }, [gameId]);

  useEffect(() => {
    if (state.gameId === gameId) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [gameId, state, storageKey]);

  const selectTile = useCallback((questionId: string) => {
    setState((currentState) => ({
      ...currentState,
      currentQuestionId: questionId
    }));
  }, []);

  const markQuestionUsed = useCallback((questionId?: string) => {
    setState((currentState) => {
      const questionIdToMark = questionId ?? currentState.currentQuestionId;

      if (!questionIdToMark) {
        return currentState;
      }

      if (currentState.revealedQuestionIds.includes(questionIdToMark)) {
        return currentState;
      }

      return {
        ...currentState,
        revealedQuestionIds: [
          ...currentState.revealedQuestionIds,
          questionIdToMark
        ]
      };
    });
  }, []);

  const clearCurrentQuestion = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      currentQuestionId: undefined
    }));
  }, []);

  const resetSession = useCallback(() => {
    setState(createDefaultSessionState(gameId));
  }, [gameId]);

  return {
    state,
    currentQuestionId: state.currentQuestionId,
    revealedQuestionIds: state.revealedQuestionIds,
    selectTile,
    markQuestionUsed,
    clearCurrentQuestion,
    resetSession
  };
}
