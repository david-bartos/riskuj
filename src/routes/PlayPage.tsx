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
  onExit?: () => void;
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

function eventDateLabel(title: string) {
  const match = title.match(/(\d{1,2})\.(\d{1,2})/);
  return match ? `${match[1]}.${match[2]}.` : "";
}

function PresenterView({ game, onExit }: { game: Game; onExit?: () => void }) {
  const presenterRef = useRef<HTMLElement>(null);
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen(presenterRef);
  const flow = usePresenterFlow(game);
  const [isSoundEnabled] = useState(true);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const activeRound = game.rounds[activeRoundIndex] ?? game.rounds[0];
  const dateLabel = eventDateLabel(game.title);

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



  return (
    <section
      className="presenter-shell"
      aria-labelledby="play-title"
      data-fullscreen={isFullscreen ? "true" : "false"}
      ref={presenterRef}
    >
      <header className="presenter-header presenter-header-compact">
        <button
          type="button"
          className="presenter-exit-button"
          aria-label="Zpět ze hry"
          onClick={onExit ?? (() => window.history.back())}
        >
          ◀
        </button>
        <h1 id="play-title">Riskuj!</h1>
        <TeamScoreboard
          teams={game.teams}
          scores={flow.session.teamScores}
          activeTeamId={flow.session.activeTeamId}
          onSelectTeam={flow.selectTeam}
        />
        <div className="presenter-date" aria-label="Datum hry">
          {dateLabel}
        </div>
      </header>

      <nav className="round-tabs" role="tablist" aria-label="Kola soutěže">
        {game.rounds.map((round, index) => (
          <button
            type="button"
            role="tab"
            key={round.id}
            aria-selected={index === activeRoundIndex}
            className="round-tab-button"
            onClick={() => setActiveRoundIndex(index)}
          >
            {index + 1}
          </button>
        ))}
      </nav>

      <div className="presenter-board" data-active-round={activeRound?.id}>
        {activeRound?.type === "question" ? (
          <section className="round-section" key={activeRound.id}>
            <h2>{activeRound.title}</h2>
            <div className="question-grid question-grid-compact">
              {activeRound.categories.map((category) => (
                <div key={category.id} className="question-column">
                  <h3>{category.title}</h3>
                  {questionItems(activeRound)
                    .filter((item) => item.categoryId === category.id)
                    .map((item) => (
                      <button
                        aria-label={`${category.title} za ${formatMoney(item.value ?? item.points)}`}
                        aria-disabled={false}
                        className="tile-button"
                        data-state={tileState(activeRound.id, item.id)}
                        style={tileStyle(item.id)}
                        key={item.id}
                        onClick={() => selectItem(activeRound.id, activeRound.type, item.id)}
                        type="button"
                      >
                        {formatMoney(item.value ?? item.points)}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeRound?.type === "listening" ? (
          <section className="round-section" key={activeRound.id}>
            <h2>{activeRound.title}</h2>
            <div className="question-grid listening-grid-compact">
              {listeningItems(activeRound).map((item, index) => {
                const genre = (activeRound.genres ?? activeRound.categories).find(
                  (candidate) => candidate.id === (item.genreId ?? item.categoryId)
                );
                return (
                  <button
                    aria-label={`${genre?.title ?? "Poslech"}: poslech`}
                    aria-disabled={false}
                    className="tile-button"
                    data-state={tileState(activeRound.id, item.id)}
                    style={tileStyle(item.id)}
                    key={item.id}
                    onClick={() => selectItem(activeRound.id, activeRound.type, item.id)}
                    type="button"
                  >
                    {index + 1}. {genre?.title ?? "Poslech"}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeRound?.type === "common-denominator" ? (
          <section className="round-section" key={activeRound.id}>
            <h2>{activeRound.title}</h2>
            <div className="question-grid common-grid-compact">
              {commonItems(activeRound).map((item, index) => (
                <button
                  aria-label={`${item.title} za ${formatMoney(item.value)}`}
                  aria-disabled={false}
                  className="tile-button"
                  data-state={tileState(activeRound.id, item.id)}
                  style={tileStyle(item.id)}
                  key={item.id}
                  onClick={() => selectItem(activeRound.id, activeRound.type, item.id)}
                  type="button"
                >
                  {index + 1}. {formatMoney(item.value)}
                </button>
              ))}
            </div>
          </section>
        ) : null}
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
                        {team.name.toLocaleLowerCase("cs-CZ")}
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
                      {team.name.toLocaleLowerCase("cs-CZ")}
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

export function PlayPage({ gameId, onExit }: PlayPageProps) {
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

  return <PresenterView game={game} onExit={onExit} />;
}

export default PlayPage;



