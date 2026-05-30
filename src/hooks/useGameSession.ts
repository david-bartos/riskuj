import { useState } from "react";

type GameSession = {
  gameId: string;
  currentQuestionId: string | null;
  revealedQuestionIds: string[];
  selectTile: (questionId: string) => void;
  markQuestionUsed: (questionId: string) => void;
};

export function useGameSession(gameId: string): GameSession {
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<string[]>([]);

  return {
    gameId,
    currentQuestionId,
    revealedQuestionIds,
    selectTile: setCurrentQuestionId,
    markQuestionUsed: (questionId: string) => {
      setRevealedQuestionIds((usedQuestionIds) =>
        usedQuestionIds.includes(questionId)
          ? usedQuestionIds
          : [...usedQuestionIds, questionId]
      );
      setCurrentQuestionId((selectedQuestionId) =>
        selectedQuestionId === questionId ? null : selectedQuestionId
      );
    }
  };
}
