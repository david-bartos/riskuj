import { useEffect, useMemo, useRef, useState } from "react";
import { gamesClient } from "../api/gamesClient";
import { playSfx, type SfxName } from "../audio/sfx";
import CommonDenominatorRoundScreen from "../components/game/CommonDenominatorRoundScreen";
import ListeningRoundScreen from "../components/game/ListeningRoundScreen";
import TeamScoreboard from "../components/game/TeamScoreboard";
import { useFullscreen } from "../hooks/useFullscreen";
import { usePresenterFlow } from "../hooks/usePresenterFlow";
import type {
  CommonDenominatorItem,
  CommonDenominatorRound,
  Game,
  ListeningItem,
  ListeningRound,
  QuestionItem,
  QuestionRound,
  RoundType
} from "../types/game";
import { listeningScoreOptions } from "../types/game";

type PlayPageProps = {
  gameId: string;
};

type ActiveContent =
  | { type: "question"; round: QuestionRound; item: QuestionItem }
  | { type: "listening"; round: ListeningRound; item: ListeningItem }
  | { type: "common-denominator"; round: CommonDenominatorRound; item: CommonDenominatorItem };

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("cs-CZ").format(value).replace(/\u00a0/g, " ")} Kč`;
}

function questionItems(round: QuestionRound) {
  return round.items ?? round.questions;
}

function listeningItems(round: ListeningRound) {
  return round.items ?? round.tracks;
}

function commonItems(round: CommonDenominatorRound) {
  return (
    round.items ?? [
      {
        id: round.id,
        title: round.title,
        clues: round.clues,
        answer: round.answer,
        value: (round.points ?? 0) as CommonDenominatorItem["value"]
      }
    ]
  );
}

function getActiveContent(game: Game, roundId?: string, itemId?: string): ActiveContent | null {
  if (!roundId || !itemId) {
    return null;
  }

  const round = game.rounds.find((candidate) => candidate.id === roundId);
  if (round?.type === "question") {
    const item = questionItems(round).find((candidate) => candidate.id === itemId);
    return item ? { type: "question", round, item } : null;
  }

  if (round?.type === "listening") {
    const item = listeningItems(round).find((candidate) => candidate.id === itemId);
    return item ? { type: "listening", round, item } : null;
  }

  if (round?.type === "common-denominator") {
    const item = commonItems(round).find((candidate) => candidate.id === itemId);
    return item ? { type: "common-denominator", round, item } : null;
  }

  return null;
}

function AudioPlayer({ src }: { src: string }) {
  return <audio aria-label="Přehrát audio ukázku" controls src={src} />;
}

function PresenterView({ game }: { game: Game }) {
  const presenterRef = useRef<HTMLElement>(null);
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen(presenterRef);
  const flow = usePresenterFlow(game);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const activeContent = useMemo(
    () =>
      getActiveContent(
        game,
        flow.session.activeItem?.roundId,
        flow.session.activeItem?.itemId
      ),
    [flow.session.activeItem, game]
  );

  useEffect(() => {
    function handleEnter(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        flow.advance();
      }
    }

    window.addEventListener("keydown", handleEnter);
    return () => window.removeEventListener("keydown", handleEnter);
  }, [flow]);

  function playPresenterSfx(name: SfxName) {
    if (isSoundEnabled) {
      playSfx(name);
    }
  }

  function isActiveSelectedItem(roundId: string, itemId: string) {
    return (
      flow.session.presenterStep === "item-selected" &&
      flow.session.activeItem?.roundId === roundId &&
      flow.session.activeItem.itemId === itemId
    );
  }

  function tileState(roundId: string, itemId: string) {
    const award = flow.session.itemAwards[itemId];
    if (award?.teamId) {
      return "awarded";
    }

    if (award) {
      return "unanswered";
    }

    if (flow.session.completedItemIds.includes(itemId)) {
      return "completed";
    }

    if (isActiveSelectedItem(roundId, itemId)) {
      return "selected";
    }

    return "available";
  }

  function selectItem(roundId: string, roundType: RoundType, itemId: string) {
    if (isActiveSelectedItem(roundId, itemId)) {
      flow.advance();
      return;
    }

    if (flow.session.completedItemIds.includes(itemId)) {
      flow.reopenItemForCorrection(roundId, roundType, itemId);
      return;
    }

    flow.selectItem(roundId, roundType, itemId);
    playPresenterSfx("open");
  }

  function tileStyle(itemId: string) {
    const teamId = flow.session.itemAwards[itemId]?.teamId;
    const team = game.teams.find((candidate) => candidate.id === teamId);
    return team?.color ? { backgroundColor: team.color } : undefined;
  }

  function awardValueLabel(value: number) {
    return formatMoney(value);
  }

  function markCorrect() {
    flow.markQuestionCorrect();
    playPresenterSfx("correct");
  }

  function markWrong() {
    flow.markQuestionWrong();
    playPresenterSfx("wrong");
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
        <TeamScoreboard
          teams={game.teams}
          scores={flow.session.teamScores}
          activeTeamId={flow.session.activeTeamId}
          onSelectTeam={flow.selectTeam}
          onAdjustScore={flow.adjustScore}
        />
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
                          const isCompleted = flow.session.completedItemIds.includes(item.id);
                          return (
                            <button
                              aria-disabled={false}
                              className="tile-button"
                              data-state={tileState(round.id, item.id)}
                              style={tileStyle(item.id)}
                              key={item.id}
                              onClick={() => selectItem(round.id, round.type, item.id)}
                              type="button"
                            >
                              {category.title} za {formatMoney(item.value ?? item.points)}
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
                    const genre = (round.genres ?? round.categories).find(
                      (candidate) => candidate.id === (item.genreId ?? item.categoryId)
                    );
                    const isCompleted = flow.session.completedItemIds.includes(item.id);
                    return (
                      <button
                        aria-disabled={false}
                        className="tile-button"
                        data-state={tileState(round.id, item.id)}
                        style={tileStyle(item.id)}
                        key={item.id}
                        onClick={() => selectItem(round.id, round.type, item.id)}
                        type="button"
                      >
                        {genre?.title ?? "Poslech"}: poslech
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
              <div className="question-grid">
                {commonItems(round).map((item) => {
                  const isCompleted = flow.session.completedItemIds.includes(item.id);
                  return (
                    <button
                      aria-disabled={false}
                      className="tile-button"
                      data-state={tileState(round.id, item.id)}
                      style={tileStyle(item.id)}
                      key={item.id}
                      onClick={() => selectItem(round.id, round.type, item.id)}
                      type="button"
                    >
                      {item.title} za {formatMoney(item.value)}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {activeContent && flow.session.presenterStep === "item-selected" ? (
        <p className="selected-tile-status" aria-live="polite">
          Dlaždice je vybraná
        </p>
      ) : null}

      {activeContent && flow.session.presenterStep !== "item-selected" ? (
        <div className="presenter-dialog-backdrop">
          <section
            className="presenter-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="presenter-dialog-title"
          >
            <div className="presenter-dialog-content">
              {activeContent.type === "question" ? (
                <>
                  <h2 id="presenter-dialog-title">
                    Otázka za {formatMoney(activeContent.item.value ?? activeContent.item.points)}
                  </h2>
                  <p>{activeContent.item.prompt}</p>
                  {activeContent.item.audio ? <AudioPlayer src={activeContent.item.audio.src} /> : null}
                  {flow.answerVisible ? (
                    <div className="answer-panel">
                      <h3>Odpověď</h3>
                      <p>{activeContent.item.answer}</p>
                      {activeContent.item.moderatorNote ? <p>{activeContent.item.moderatorNote}</p> : null}
                    </div>
                  ) : null}
                </>
              ) : null}

              {activeContent.type === "listening" ? (
                <>
                  <h2 id="presenter-dialog-title">Poslechová otázka</h2>
                  <ListeningRoundScreen item={activeContent.item} answerVisible={flow.answerVisible} />
                </>
              ) : null}

              {activeContent.type === "common-denominator" ? (
                <>
                  <h2 id="presenter-dialog-title">Společný jmenovatel</h2>
                  <CommonDenominatorRoundScreen
                    item={activeContent.item}
                    visibleClueIds={flow.session.revealedClueIds}
                    answerVisible={flow.answerVisible}
                  />
                </>
              ) : null}
            </div>

            <div className="presenter-dialog-actions">
              {!flow.answerVisible ? (
                <button type="button" onClick={flow.advance}>
                  Zobrazit odpověď
                </button>
              ) : null}

              {flow.answerVisible && activeContent.type === "question" ? (
                <div className="scoring-controls scoring-controls-teams">
                  {game.teams.map((team) => {
                    const value = activeContent.item.value ?? activeContent.item.points;
                    return (
                      <button
                        type="button"
                        key={team.id}
                        className="team-award-button"
                        style={{ backgroundColor: team.color }}
                        onClick={() => flow.awardActiveItemToTeam(team.id)}
                      >
                        Přičíst {team.name}: {awardValueLabel(value)}
                      </button>
                    );
                  })}
                  <button type="button" className="no-award-button" onClick={flow.markActiveItemUnanswered}>
                    Nikdo neuhodl
                  </button>
                  <button type="button" onClick={() => flow.returnToBoard()}>
                    Zpět na tabuli
                  </button>
                </div>
              ) : null}

              {flow.answerVisible && activeContent.type === "listening" ? (
                <div className="scoring-controls">
                  {game.teams.map((team) => (
                    <label className="field-stack" key={team.id}>
                      <span>{team.name}</span>
                      <select
                        value={flow.session.listeningScoringDraft[team.id] ?? 0}
                        onChange={(event) =>
                          flow.setListeningTeamScore(team.id, Number(event.target.value) as 0)
                        }
                      >
                        {listeningScoreOptions.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <button type="button" onClick={flow.applyListeningScores}>
                    Zapsat poslechové body
                  </button>
                </div>
              ) : null}

              {flow.answerVisible && activeContent.type === "common-denominator" ? (
                <div className="scoring-controls scoring-controls-teams">
                  {game.teams.map((team) => (
                    <button
                      type="button"
                      key={team.id}
                      className="team-award-button"
                      style={{ backgroundColor: team.color }}
                      onClick={() => flow.awardCommonDenominator(team.id)}
                    >
                      Přičíst {team.name}: {awardValueLabel(activeContent.item.value)}
                    </button>
                  ))}
                  <button type="button" className="no-award-button" onClick={flow.markActiveItemUnanswered}>
                    Nikdo neuhodl
                  </button>
                  <button type="button" onClick={() => flow.returnToBoard()}>
                    Zpět na tabuli
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export function PlayPage({ gameId }: PlayPageProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setError("");
        const loadedGame = await gamesClient.loadGame(gameId);
        if (isMounted) {
          setGame(loadedGame);
        }
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

  return <PresenterView game={game} />;
}

export default PlayPage;



