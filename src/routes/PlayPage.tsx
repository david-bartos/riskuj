import { useEffect, useMemo, useRef, useState } from "react";
import { gamesClient } from "../api/gamesClient";
import { playSfx, type SfxName } from "../audio/sfx";
import { useFullscreen } from "../hooks/useFullscreen";
import type {
  CommonDenominatorRound,
  Game,
  ListeningItem,
  ListeningRound,
  QuestionItem,
  QuestionRound
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
      round: ListeningRound;
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

function selectedId(target: SelectedTarget) {
  if (target.kind === "common-denominator") {
    return `${target.kind}:${target.roundId}`;
  }

  return `${target.kind}:${target.roundId}:${target.itemId}`;
}

function questionItems(round: QuestionRound) {
  return round.questions.length > 0 ? round.questions : round.items ?? [];
}

function listeningItems(round: ListeningRound) {
  return round.tracks.length > 0 ? round.tracks : round.items ?? [];
}

function listeningAnswerTitle(item: ListeningItem) {
  return item.trackTitleAnswer ?? item.title ?? item.answer;
}

function listeningAnswerArtist(item: ListeningItem) {
  return item.artistAnswer ?? item.artist ?? "";
}

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
    const item = questionItems(round).find((candidate) => candidate.id === selected.itemId);
    return item ? { kind: "question", round, item, points: item.points } : null;
  }

  if (selected.kind === "listening" && round.type === "listening") {
    const item = listeningItems(round).find((candidate) => candidate.id === selected.itemId);
    return item ? { kind: "listening", round, item, points: item.points ?? 0 } : null;
  }

  if (selected.kind === "common-denominator" && round.type === "common-denominator") {
    return { kind: "common-denominator", round, points: round.points ?? 0 };
  }

  return null;
}

function AudioPlayer({ src }: { src: string }) {
  return <audio aria-label="Přehrát audio ukázku" controls src={src} />;
}

export function PlayPage({ gameId }: PlayPageProps) {
  const presenterRef = useRef<HTMLElement>(null);
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen(presenterRef);
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [phase, setPhase] = useState<Phase>("board");
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeTeamId, setActiveTeamId] = useState("");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setError("");
        const loadedGame = await gamesClient.loadGame(gameId);
        if (!isMounted) {
          return;
        }

        setGame(loadedGame);
        setScores(Object.fromEntries(loadedGame.teams.map((team) => [team.id, 0])));
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

  function playPresenterSfx(name: SfxName) {
    if (isSoundEnabled) {
      playSfx(name);
    }
  }

  function selectTarget(target: SelectedTarget) {
    if (completedIds.includes(selectedId(target))) {
      return;
    }

    setSelected(target);
    setPhase("board");
    playPresenterSfx("open");
  }

  function scoreSelected(direction: 1 | -1) {
    if (!selectedContent || !activeTeamId) {
      return;
    }

    setScores((currentScores) => ({
      ...currentScores,
      [activeTeamId]: (currentScores[activeTeamId] ?? 0) + selectedContent.points * direction
    }));
  }

  function completeSelected(direction: 1 | -1, sfxName: Extract<SfxName, "correct" | "wrong">) {
    scoreSelected(direction);
    playPresenterSfx(sfxName);
    returnToBoard();
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
      <section className="page-panel page-panel-wide play-page" aria-labelledby="play-title">
        <h1 id="play-title">Hra nenalezena</h1>
        <p className="page-copy">{error}</p>
      </section>
    );
  }

  if (!game) {
    return (
      <section className="page-panel page-panel-wide play-page" aria-labelledby="play-title">
        <h1 id="play-title">Načítám hru</h1>
      </section>
    );
  }

  return (
    <section
      className="presenter-shell"
      aria-labelledby="play-title"
      data-fullscreen={isFullscreen ? "true" : "false"}
      ref={presenterRef}
    >
      <header className="presenter-header">
        <div>
          <p className="stage-label">Projektorový režim</p>
          <h1 id="play-title">{game.title}</h1>
        </div>
        <section className="scoreboard" aria-label="Skóre týmů" role="region">
          {game.teams.map((team) => (
            <div key={team.id} className="scoreboard-team">
              <span>{team.name}</span>
              <strong>{scores[team.id] ?? 0}</strong>
            </div>
          ))}
        </section>
        <div className="presenter-controls" aria-label="Ovládání prezentace">
          <button
            className="presenter-control-button"
            disabled={!isSupported}
            type="button"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? "Ukončit celou obrazovku" : "Celá obrazovka"}
          </button>
          <button
            className="presenter-control-button"
            type="button"
            onClick={() => setIsSoundEnabled((current) => !current)}
          >
            {isSoundEnabled ? "Zvuk zapnutý" : "Zvuk vypnutý"}
          </button>
        </div>
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
                      {questionItems(round)
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
                  {listeningItems(round).map((item) => {
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
                        Poslech za {item.points ?? 0}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          }

          const target: SelectedTarget = { kind: "common-denominator", roundId: round.id };
          const isCompleted = completedIds.includes(selectedId(target));

          return (
            <section className="round-section" key={round.id}>
              <h2>{round.title}</h2>
              <button
                aria-disabled={isCompleted}
                className="tile-button"
                disabled={isCompleted}
                onClick={() => selectTarget(target)}
                type="button"
              >
                Společný jmenovatel za {round.points ?? 0}
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
              {selectedContent.item.audio ? (
                <AudioPlayer src={selectedContent.item.audio.src} />
              ) : null}
              {phase === "answer" ? (
                <div className="answer-panel">
                  <h3>Odpověď</h3>
                  <p>{selectedContent.item.answer}</p>
                  {selectedContent.item.moderatorNote ? (
                    <p>{selectedContent.item.moderatorNote}</p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {selectedContent.kind === "listening" && (
            <>
              <h2>Poslech za {selectedContent.item.points ?? 0}</h2>
              <p>{selectedContent.item.prompt}</p>
              {selectedContent.item.audio ? (
                <AudioPlayer src={selectedContent.item.audio.src} />
              ) : null}
              {phase === "answer" ? (
                <div className="answer-panel">
                  <h3>Odpověď</h3>
                  <p>Název: {listeningAnswerTitle(selectedContent.item)}</p>
                  {listeningAnswerArtist(selectedContent.item) ? (
                    <p>Interpret: {listeningAnswerArtist(selectedContent.item)}</p>
                  ) : null}
                  {selectedContent.item.moderatorNote ? (
                    <p>{selectedContent.item.moderatorNote}</p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {selectedContent.kind === "common-denominator" && (
            <>
              <h2>{selectedContent.round.title}</h2>
              <ol className="clue-list">
                {selectedContent.round.clues.map((clue, index) => (
                  <li key={clue.id}>
                    <strong>Nápověda {index + 1}</strong>
                    <span>{clue.prompt ?? clue.text}</span>
                    {clue.audio ? <AudioPlayer src={clue.audio.src} /> : null}
                  </li>
                ))}
              </ol>
              {phase === "answer" ? (
                <div className="answer-panel">
                  <h3>Finální odpověď</h3>
                  <p>{selectedContent.round.answer}</p>
                  {selectedContent.round.moderatorNote ? (
                    <p>{selectedContent.round.moderatorNote}</p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {phase === "answer" ? (
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
              <button type="button" onClick={() => completeSelected(1, "correct")}>
                Správně
              </button>
              <button type="button" onClick={() => completeSelected(-1, "wrong")}>
                Špatně
              </button>
              <button type="button" onClick={returnToBoard}>
                Zpět na tabuli
              </button>
            </div>
          ) : null}
        </section>
      )}
    </section>
  );
}

export default PlayPage;
