import { useCallback, useMemo, useState } from "react";
import type { Game, MoneyValue, Round, RoundType } from "../types/game";
import type { GameSession } from "../types/session";

function createSession(game: Game): GameSession {
  return {
    gameId: game.id,
    teamScores: game.teams.map((team) => ({ teamId: team.id, score: 0 })),
    activeRoundId: game.rounds[0]?.id ?? "",
    activeTeamId: game.teams[0]?.id,
    presenterStep: "board",
    completedItemIds: [],
    revealedClueIds: [],
    listeningScoringDraft: {}
  };
}

function findRound(game: Game, roundId: string): Round | undefined {
  return game.rounds.find((round) => round.id === roundId);
}

function itemValue(game: Game, roundId: string, itemId: string): number {
  const round = findRound(game, roundId);

  if (round?.type === "question") {
    const item = (round.items ?? round.questions).find((candidate) => candidate.id === itemId);
    return item?.value ?? item?.points ?? 0;
  }

  if (round?.type === "common-denominator") {
    const item = round.items?.find((candidate) => candidate.id === itemId);
    return item?.value ?? round.points ?? 0;
  }

  return 0;
}

export function usePresenterFlow(game: Game) {
  const [session, setSession] = useState(() => createSession(game));

  const answerVisible = session.presenterStep === "answer-visible" || session.presenterStep === "scoring";

  const scoreForTeam = useCallback(
    (teamId: string) => {
      return session.teamScores.find((entry) => entry.teamId === teamId)?.score ?? 0;
    },
    [session.teamScores]
  );

  const adjustScore = useCallback((teamId: string, delta: number) => {
    setSession((current) => ({
      ...current,
      teamScores: current.teamScores.map((entry) =>
        entry.teamId === teamId ? { ...entry, score: entry.score + delta } : entry
      )
    }));
  }, []);

  const returnToBoard = useCallback((completedItemId?: string) => {
    setSession((current) => {
      const itemId = completedItemId ?? current.activeItem?.itemId;
      const completedItemIds =
        itemId && !current.completedItemIds.includes(itemId)
          ? [...current.completedItemIds, itemId]
          : current.completedItemIds;

      return {
        ...current,
        activeItem: undefined,
        presenterStep: "board",
        completedItemIds,
        listeningScoringDraft: {}
      };
    });
  }, []);

  const selectTeam = useCallback((teamId: string) => {
    setSession((current) => ({ ...current, activeTeamId: teamId }));
  }, []);

  const selectItem = useCallback((roundId: string, roundType: RoundType, itemId: string) => {
    setSession((current) => ({
      ...current,
      activeRoundId: roundId,
      activeItem: { roundId, roundType, itemId },
      presenterStep: "item-selected",
      listeningScoringDraft: {}
    }));
  }, []);

  const advance = useCallback(() => {
    setSession((current) => {
      if (!current.activeItem) {
        return current;
      }

      if (current.presenterStep === "item-selected") {
        return { ...current, presenterStep: "prompt-visible" };
      }

      if (current.presenterStep === "prompt-visible") {
        return { ...current, presenterStep: "answer-visible" };
      }

      if (current.presenterStep === "answer-visible") {
        return { ...current, presenterStep: "scoring" };
      }

      return current;
    });
  }, []);

  const markQuestionCorrect = useCallback(() => {
    setSession((current) => {
      const activeItem = current.activeItem;
      if (!activeItem || !current.activeTeamId) {
        return current;
      }

      const value = itemValue(game, activeItem.roundId, activeItem.itemId);
      return {
        ...current,
        activeItem: undefined,
        presenterStep: "board",
        completedItemIds: current.completedItemIds.includes(activeItem.itemId)
          ? current.completedItemIds
          : [...current.completedItemIds, activeItem.itemId],
        teamScores: current.teamScores.map((entry) =>
          entry.teamId === current.activeTeamId ? { ...entry, score: entry.score + value } : entry
        )
      };
    });
  }, [game]);

  const markQuestionWrong = useCallback(() => {
    returnToBoard();
  }, [returnToBoard]);

  const setListeningTeamScore = useCallback((teamId: string, value: MoneyValue) => {
    setSession((current) => ({
      ...current,
      listeningScoringDraft: {
        ...current.listeningScoringDraft,
        [teamId]: value
      }
    }));
  }, []);

  const applyListeningScores = useCallback(() => {
    setSession((current) => {
      const activeItem = current.activeItem;
      return {
        ...current,
        activeItem: undefined,
        presenterStep: "board",
        completedItemIds:
          activeItem && !current.completedItemIds.includes(activeItem.itemId)
            ? [...current.completedItemIds, activeItem.itemId]
            : current.completedItemIds,
        teamScores: current.teamScores.map((entry) => ({
          ...entry,
          score: entry.score + (current.listeningScoringDraft[entry.teamId] ?? 0)
        })),
        listeningScoringDraft: {}
      };
    });
  }, []);

  const awardCommonDenominator = useCallback(
    (teamId: string) => {
      setSession((current) => {
        const activeItem = current.activeItem;
        if (!activeItem) {
          return current;
        }

        const value = itemValue(game, activeItem.roundId, activeItem.itemId);
        return {
          ...current,
          activeItem: undefined,
          presenterStep: "board",
          completedItemIds: current.completedItemIds.includes(activeItem.itemId)
            ? current.completedItemIds
            : [...current.completedItemIds, activeItem.itemId],
          teamScores: current.teamScores.map((entry) =>
            entry.teamId === teamId ? { ...entry, score: entry.score + value } : entry
          )
        };
      });
    },
    [game]
  );

  const activeRound = useMemo(
    () => (session.activeItem ? findRound(game, session.activeItem.roundId) : undefined),
    [game, session.activeItem]
  );

  return {
    session,
    answerVisible,
    activeRound,
    selectTeam,
    selectItem,
    advance,
    markQuestionCorrect,
    markQuestionWrong,
    adjustScore,
    scoreForTeam,
    setListeningTeamScore,
    applyListeningScores,
    awardCommonDenominator,
    returnToBoard
  };
}
