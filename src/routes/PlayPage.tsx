import { useEffect, useMemo, useState } from "react";
import type {
  CommonDenominatorRound,
  Game,
  ListeningItem,
  QuestionItem,
  QuestionRound,
  Round
} from "../types/game";

type Phase = "board" | "prompt" | "answer";

type SelectedTarget =
  | { kind: "question"; roundId: string; itemId: string }
  | { kind: "listening"; roundId: string; itemId: string }
  | { kind: "common-denominator"; roundId: string };

type SelectedContent =
  | {
      kind: "question";
      round: QuestionRound;
      item: QuestionItem;
      points: number;
    }
  | {
      kind: "listening";
      round: Round;
      item: ListeningItem;
      points: number;
    }
  | {
      kind: "common-denominator";
      round: CommonDenominatorRound;
      points: number;
    };

type PlayPageProps = {
  gameId: string;
};

const selectedId = (target: SelectedTarget) => {
  if (target.kind === "common-denominator") {
    return `${target.kind}:${target.roundId}`;
  }

  return `${target.kind}:${target.roundId}:${target.itemId}`;
};

function findSelectedContent(
  game: Game | null,
  selected: SelectedTarget | null
): SelectedContent | null {
  if (!game || !selected) {
    return null;
  }

  const round = game.rounds.find((candidate) => candidate.id === selected.roundId);
  if (!round) {
    return null;
  }

  if (selected.kind === "question" && round.type === "question") {
    const item = round.items.find((candidate) => candidate.id === selected.itemId);
    return item ? { kind: "question", round, item, points: item.points } : null;
  }

  if (selected.kind === "listening" && round.type === "listening") {
    const item = round.items.find((candidate) => candidate.id === selected.itemId);
    return item ? { kind: "listening", round, item, points: item.points } : null;
  }

  if (
    selected.kind === "common-denominator" &&
    round.type === "common-denominator"
  ) {
    return { kind: "common-denominator", round, points: round.points };
  }

  return null;
}

function AudioPlayer({ src }: { src: string }) {
  return <audio aria-label="Přehrát audio ukázku" controls src={src} />;
}

export default function PlayPage({ gameId }: PlayPageProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [phase, setPhase] = useState<Phase>("board");
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeTeamId, setActiveTeamId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setError("");
        const response = await fetch(`/api/games/${encodeURIComponent(gameId)}`);
        if (!response.ok) {
          throw new Error("Game request failed");
        }

        const loadedGame = (await response.json()) as Game;
        if (!isMounted) {
          return;
        }

        setGame(loadedGame);
        setScores(
          Object.fromEntries(loadedGame.teams.map((team) => [team.id, 0]))
        );
        setActiveTeamId(loadedGame.teams[0]?.id ?? "");
        setSelected(null);
        setPhase("board");
        setCompletedIds([]);
      } catch {
        if (isMounted) {
          setError("Hru se nepodařilo načíst.");
        }
      }
    }

    void loadGame();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  useEffect(() => {
    function handleEnter(event: KeyboardEvent) {
      if (event.key !== "Enter" || !selected) {
        return;
      }

      setPhase((currentPhase) => {
        if (currentPhase === "board") {
          return "prompt";
        }

        if (currentPhase === "prompt") {
          return "answer";
        }

        return currentPhase;
      });
    }

    window.addEventListener("keydown", handleEnter);
    return () => window.removeEventListener("keydown", handleEnter);
  }, [selected]);

  const selectedContent = useMemo(
    () => findSelectedContent(game, selected),
    [game, selected]
  );

  function selectTarget(target: SelectedTarget) {
    if (completedIds.includes(selectedId(target))) {
      return;
    }

    setSelected(target);
    setPhase("board");
  }

  function scoreSelected(direction: 1 | -1) {
    if (!selectedContent || !activeTeamId) {
      return;
    }

    setScores((currentScores) => ({
      ...currentScores,
      [activeTeamId]:
        (currentScores[activeTeamId] ?? 0) + selectedContent.points * direction
    }));
  }

  function returnToBoard() {
    if (selected) {
      setCompletedIds((currentIds) => [...new Set([...currentIds, selectedId(selected)])]);
    }

    setSelected(null);
    setPhase("board");
  }

  if (error) {
    return (
      <main className="presenter-shell">
        <p>{error}</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="presenter-shell">
        <p>Načítám hru.</p>
      </main>
    );
  }

  return (
    <main className="presenter-shell">
      <header className="presenter-header">
        <h1>{game.title}</h1>
        <section className="scoreboard" aria-label="Skóre týmů" role="region">
          {game.teams.map((team) => (
            <div key={team.id} className="scoreboard-team">
              <span>{team.name}</span>
              <strong>{scores[team.id] ?? 0}</strong>
            </div>
          ))}
        </section>
      </header>

      <div className="presenter-board">
        {game.rounds.map((round) => {
          if (round.type === "question") {
            return (
              <section className="round-section" key={round.id}>
                <h2>{round.title}</h2>
                <div className="question-grid">
                  {round.categories.map((category) => (
                    <div key={category.id} className="question-column">
                      <h3>{category.title}</h3>
                      {round.items
                        .filter((item) => item.categoryId === category.id)
                        .map((item) => {
                          const target: SelectedTarget = {
                            kind: "question",
                            roundId: round.id,
                            itemId: item.id
                          };
                          const id = selectedId(target);
                          const isCompleted = completedIds.includes(id);
                          return (
                            <button
                              aria-disabled={isCompleted}
                              className="tile-button"
                              disabled={isCompleted}
                              key={item.id}
                              onClick={() => selectTarget(target)}
                              type="button"
                            >
                              {category.title} za {item.points}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (round.type === "listening") {
            return (
              <section className="round-section" key={round.id}>
                <h2>{round.title}</h2>
                <div className="question-grid">
                  {round.items.map((item) => {
                    const target: SelectedTarget = {
                      kind: "listening",
                      roundId: round.id,
                      itemId: item.id
                    };
                    const id = selectedId(target);
                    const isCompleted = completedIds.includes(id);
                    return (
                      <button
                        aria-disabled={isCompleted}
                        className="tile-button"
                        disabled={isCompleted}
                        key={item.id}
                        onClick={() => selectTarget(target)}
                        type="button"
                      >
                        Poslech za {item.points}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          }

          return (
            <section className="round-section" key={round.id}>
              <h2>{round.title}</h2>
              <button
                aria-disabled={completedIds.includes(
                  selectedId({ kind: "common-denominator", roundId: round.id })
                )}
                className="tile-button"
                disabled={completedIds.includes(
                  selectedId({ kind: "common-denominator", roundId: round.id })
                )}
                onClick={() =>
                  selectTarget({
                    kind: "common-denominator",
                    roundId: round.id
                  })
                }
                type="button"
              >
                Společný jmenovatel za {round.points}
              </button>
            </section>
          );
        })}
      </div>

      {selectedContent && phase !== "board" && (
        <section className="presenter-panel" aria-label="Vybraná položka">
          {selectedContent.kind === "question" && (
            <>
              <h2>Otázka za {selectedContent.item.points}</h2>
              <p>{selectedContent.item.prompt}</p>
              {selectedContent.item.audio && (
                <AudioPlayer src={selectedContent.item.audio.src} />
              )}
              {phase === "answer" && (
                <div className="answer-panel">
                  <h3>Odpověď</h3>
                  <p>{selectedContent.item.answer}</p>
                  {selectedContent.item.moderatorNote && (
                    <p>{selectedContent.item.moderatorNote}</p>
                  )}
                </div>
              )}
            </>
          )}

          {selectedContent.kind === "listening" && (
            <>
              <h2>Poslech za {selectedContent.item.points}</h2>
              <p>{selectedContent.item.prompt}</p>
              {selectedContent.item.audio && (
                <AudioPlayer src={selectedContent.item.audio.src} />
              )}
              {phase === "answer" && (
                <div className="answer-panel">
                  <h3>Odpověď</h3>
                  <p>Název: {selectedContent.item.trackTitleAnswer}</p>
                  <p>Interpret: {selectedContent.item.artistAnswer}</p>
                  {selectedContent.item.moderatorNote && (
                    <p>{selectedContent.item.moderatorNote}</p>
                  )}
                </div>
              )}
            </>
          )}

          {selectedContent.kind === "common-denominator" && (
            <>
              <h2>{selectedContent.round.title}</h2>
              <ol className="clue-list">
                {selectedContent.round.clues.map((clue, index) => (
                  <li key={clue.id}>
                    <strong>Nápověda {index + 1}</strong>
                    <span>{clue.prompt}</span>
                    {clue.audio && <AudioPlayer src={clue.audio.src} />}
                  </li>
                ))}
              </ol>
              {phase === "answer" && (
                <div className="answer-panel">
                  <h3>Finální odpověď</h3>
                  <p>{selectedContent.round.answer}</p>
                  {selectedContent.round.moderatorNote && (
                    <p>{selectedContent.round.moderatorNote}</p>
                  )}
                </div>
              )}
            </>
          )}

          {phase === "answer" && (
            <div className="scoring-controls">
              <label>
                <span>Bodovaný tým</span>
                <select
                  value={activeTeamId}
                  onChange={(event) => setActiveTeamId(event.target.value)}
                >
                  {game.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => scoreSelected(1)}>
                Správně
              </button>
              <button type="button" onClick={() => scoreSelected(-1)}>
                Špatně
              </button>
              <button type="button" onClick={returnToBoard}>
                Zpět na tabuli
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
