import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoGame } from "../data/demoGame";
import { usePresenterFlow } from "./usePresenterFlow";

describe("usePresenterFlow", () => {
  it("postoupí otázku přes Enter a správná odpověď přičte body aktivnímu týmu", () => {
    const { result } = renderHook(() => usePresenterFlow(demoGame));
    const questionRound = demoGame.rounds[0];
    if (questionRound.type !== "question") {
      throw new Error("Expected question round");
    }

    act(() => result.current.selectTeam("team-1"));
    act(() => result.current.selectItem(questionRound.id, questionRound.type, "q-ivan-mladek"));
    expect(result.current.session.presenterStep).toBe("item-selected");

    act(() => result.current.advance());
    expect(result.current.session.presenterStep).toBe("prompt-visible");
    expect(result.current.answerVisible).toBe(false);

    act(() => result.current.advance());
    expect(result.current.session.presenterStep).toBe("answer-visible");
    expect(result.current.answerVisible).toBe(true);

    act(() => result.current.markQuestionCorrect());
    expect(result.current.scoreForTeam("team-1")).toBe(1000);
    expect(result.current.session.presenterStep).toBe("board");
    expect(result.current.session.completedItemIds).toContain("q-ivan-mladek");
  });

  it("špatná odpověď nemění skóre", () => {
    const { result } = renderHook(() => usePresenterFlow(demoGame));
    const questionRound = demoGame.rounds[0];
    if (questionRound.type !== "question") {
      throw new Error("Expected question round");
    }

    act(() => result.current.selectTeam("team-1"));
    act(() => result.current.selectItem(questionRound.id, questionRound.type, "q-ivan-mladek"));
    act(() => result.current.advance());
    act(() => result.current.advance());
    act(() => result.current.markQuestionWrong());

    expect(result.current.scoreForTeam("team-1")).toBe(0);
    expect(result.current.session.presenterStep).toBe("board");
  });

  it("ruční korekce skóre umí přičíst i odečíst body", () => {
    const { result } = renderHook(() => usePresenterFlow(demoGame));

    act(() => result.current.adjustScore("team-2", 1000));
    expect(result.current.scoreForTeam("team-2")).toBe(1000);

    act(() => result.current.adjustScore("team-2", -500));
    expect(result.current.scoreForTeam("team-2")).toBe(500);
  });

  it("poslechové skórování přičte vybrané hodnoty všem týmům najednou", () => {
    const { result } = renderHook(() => usePresenterFlow(demoGame));
    const listeningRound = demoGame.rounds[1];
    if (listeningRound.type !== "listening") {
      throw new Error("Expected listening round");
    }

    act(() => result.current.selectItem(listeningRound.id, listeningRound.type, "listen-dusilova"));
    act(() => result.current.advance());
    act(() => result.current.advance());
    act(() => result.current.setListeningTeamScore("team-1", 1000));
    act(() => result.current.setListeningTeamScore("team-2", 5000));
    act(() => result.current.applyListeningScores());

    expect(result.current.scoreForTeam("team-1")).toBe(1000);
    expect(result.current.scoreForTeam("team-2")).toBe(5000);
    expect(result.current.session.presenterStep).toBe("board");
  });

  it("společný jmenovatel umožní ručně přičíst hodnotu vybranému týmu", () => {
    const { result } = renderHook(() => usePresenterFlow(demoGame));
    const commonRound = demoGame.rounds[2];
    if (commonRound.type !== "common-denominator") {
      throw new Error("Expected common denominator round");
    }

    act(() => result.current.selectItem(commonRound.id, commonRound.type, "cd-voda"));
    act(() => result.current.advance());
    act(() => result.current.advance());
    act(() => result.current.awardCommonDenominator("team-3"));

    expect(result.current.scoreForTeam("team-3")).toBe(5000);
    expect(result.current.session.presenterStep).toBe("board");
  });
});
