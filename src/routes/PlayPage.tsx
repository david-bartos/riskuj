import { useEffect, useMemo, useRef, useState } from "react";
import { gamesClient } from "../api/gamesClient";
import { playSfx } from "../audio/sfx";
import CommonDenominatorRoundScreen from "../components/game/CommonDenominatorRoundScreen";
import ListeningRoundScreen from "../components/game/ListeningRoundScreen";
import TeamScoreboard from "../components/game/TeamScoreboard";
import { useFullscreen } from "../hooks/useFullscreen";
import { usePresenterFlow } from "../hooks/usePresenterFlow";
import type {
  CommonDenominatorItem,
  CommonDenominatorRound,
  Game,
  GameSoundEffectKey,
  ListeningItem,
  ListeningRound,
  QuestionItem,
  QuestionRound,
  RoundType
} from "../types/game";
import { listeningScoreOptions } from "../types/game";

type PlayPageProps = {
  gameId: string;
  isActive?: boolean;
  onExit?: () => void;
};

type ActiveContent =
  | { type: "question"; round: QuestionRound; item: QuestionItem }
  | { type: "listening"; round: ListeningRound; item: ListeningItem }
  | { type: "common-denominator"; round: CommonDenominatorRound; item: CommonDenominatorItem };

type FinalPlacement = {
  rank: number;
  score: number;
  teams: Array<{ id: string; name: string; color?: string }>;
};

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

function finalPlacements(
  teams: Game["teams"],
  scores: Array<{ teamId: string; score: number }>
): FinalPlacement[] {
  const scoreByTeam = new Map(scores.map((entry) => [entry.teamId, entry.score]));
  const rankedTeams = teams
    .map((team) => ({ ...team, score: scoreByTeam.get(team.id) ?? 0 }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.name.localeCompare(right.name, "cs-CZ");
    });

  const placements: FinalPlacement[] = [];
  let rank = 1;

  for (let index = 0; index < rankedTeams.length; ) {
    const score = rankedTeams[index].score;
    const tiedTeams = rankedTeams.filter((team) => team.score === score);
    placements.push({
      rank,
      score,
      teams: tiedTeams.map(({ score: _score, ...team }) => team)
    });
    index += tiedTeams.length;
    rank += tiedTeams.length;
  }

  return placements.sort((left, right) => right.rank - left.rank);
}

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("button, input, textarea, select, a[href], [role='button'], [contenteditable='true']")
  );
}

function PresenterView({
  game,
  isActive = true,
  onExit
}: {
  game: Game;
  isActive?: boolean;
  onExit?: () => void;
}) {
  const presenterRef = useRef<HTMLElement>(null);
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen(presenterRef);
  const flow = usePresenterFlow(game);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [isFinalDialogOpen, setIsFinalDialogOpen] = useState(false);
  const [revealedFinalGroups, setRevealedFinalGroups] = useState(0);
  const activeRound = game.rounds[activeRoundIndex] ?? game.rounds[0];

  const activeContent = useMemo(
    () =>
      getActiveContent(
        game,
        flow.session.activeItem?.roundId,
        flow.session.activeItem?.itemId
      ),
    [flow.session.activeItem, game]
  );
  const finalGroups = useMemo(
    () => finalPlacements(game.teams, flow.session.teamScores),
    [game.teams, flow.session.teamScores]
  );
  const visibleFinalGroups = finalGroups.slice(0, revealedFinalGroups);

  function playGameEffect(key: GameSoundEffectKey) {
    if (!game.soundEffects?.enabled) {
      return;
    }

    playSfx(game.soundEffects.effects[key]);
  }

  function willRevealAnswerOnAdvance() {
    if (!activeContent || flow.session.presenterStep !== "prompt-visible") {
      return false;
    }

    if (activeContent.type !== "common-denominator") {
      return true;
    }

    return activeContent.item.clues.every((clue) => flow.session.revealedClueIds.includes(clue.id));
  }

  function advancePresenter() {
    if (isFinalDialogOpen) {
      revealNextFinalGroup();
      return;
    }

    if (flow.session.presenterStep === "item-selected") {
      playGameEffect("questionOpened");
    } else if (willRevealAnswerOnAdvance()) {
      playGameEffect("answerRevealed");
    }

    flow.advance();
  }

  function openFinalDialog() {
    setIsFinalDialogOpen(true);
    setRevealedFinalGroups(0);
  }

  function revealNextFinalGroup() {
    const nextGroup = finalGroups[revealedFinalGroups];
    if (!nextGroup) {
      return;
    }

    playGameEffect(nextGroup.rank === 1 ? "firstPlaceRevealed" : "placementRevealed");
    setRevealedFinalGroups((current) => Math.min(current + 1, finalGroups.length));
  }

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    function handleAdvanceKey(event: KeyboardEvent) {
      if ((event.key === "Enter" || event.key === " ") && !isInteractiveElement(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        advancePresenter();
      }
    }

    window.addEventListener("keydown", handleAdvanceKey);
    return () => window.removeEventListener("keydown", handleAdvanceKey);
  }, [flow, activeContent, game, isActive, isFinalDialogOpen, finalGroups, revealedFinalGroups]);

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
      playGameEffect("questionOpened");
      flow.advance();
      return;
    }

    if (flow.session.completedItemIds.includes(itemId)) {
      flow.reopenItemForCorrection(roundId, roundType, itemId);
      playGameEffect("questionOpened");
      return;
    }

    flow.selectItem(roundId, roundType, itemId);
    playGameEffect("questionSelected");
  }

  function awardToTeam(teamId: string) {
    playGameEffect("correctAnswer");
    flow.awardActiveItemToTeam(teamId);
  }

  function markUnanswered() {
    playGameEffect("wrongAnswer");
    flow.markActiveItemUnanswered();
  }

  function applyListeningScores() {
    const hasScore = game.teams.some((team) => (flow.session.listeningScoringDraft[team.id] ?? 0) > 0);
    playGameEffect(hasScore ? "correctAnswer" : "wrongAnswer");
    flow.applyListeningScores();
  }

  function awardCommonDenominator(teamId: string) {
    playGameEffect("correctAnswer");
    flow.awardCommonDenominator(teamId);
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
        <div className="presenter-title-row">
          <h1 id="play-title">Riskuj!</h1>
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
          <button
            className="round-tab-button presenter-end-button"
            type="button"
            onClick={openFinalDialog}
          >
            Konec
          </button>
          <button
            aria-label="Admin"
            className="round-tab-button presenter-admin-button"
            type="button"
            onClick={() => {
              if (onExit) {
                onExit();
                return;
              }

              window.history.pushState({}, "", "/");
            }}
          >
            Admin
          </button>
        </div>
        <TeamScoreboard
          teams={game.teams}
          scores={flow.session.teamScores}
          activeTeamId={flow.session.activeTeamId}
          onSelectTeam={flow.selectTeam}
        />
      </header>

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
                <button type="button" onClick={advancePresenter}>
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
                        onClick={() => awardToTeam(team.id)}
                      >
                        {team.name}
                      </button>
                    );
                  })}
                  <button type="button" className="no-award-button" onClick={markUnanswered}>
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
                  <button type="button" onClick={applyListeningScores}>
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
                      onClick={() => awardCommonDenominator(team.id)}
                    >
                      {team.name}
                    </button>
                  ))}
                  <button type="button" className="no-award-button" onClick={markUnanswered}>
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

      {isFinalDialogOpen ? (
        <div className="presenter-dialog-backdrop final-dialog-backdrop">
          <section
            className="presenter-dialog final-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="final-dialog-title"
          >
            <div className="confetti-layer" aria-hidden="true">
              {Array.from({ length: 28 }, (_, index) => (
                <span key={index} />
              ))}
            </div>
            <div className="presenter-dialog-content final-dialog-content" onClick={revealNextFinalGroup}>
              <h2 id="final-dialog-title">VÍTĚZOVÉ A PORAŽENÍ</h2>
              <div className="final-placements" aria-live="polite">
                {visibleFinalGroups.map((group) => (
                  <article
                    className="final-placement-card"
                    data-rank={group.rank === 1 ? "winner" : "place"}
                    key={`${group.rank}-${group.score}`}
                  >
                    <strong>{group.rank}. místo</strong>
                    <span>{formatMoney(group.score)}</span>
                    <div className="final-placement-teams">
                      {group.teams.map((team) => (
                        <span key={team.id} style={{ borderColor: team.color, color: team.color }}>
                          {team.name}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="presenter-dialog-actions final-dialog-actions">
              <button
                type="button"
                disabled={revealedFinalGroups >= finalGroups.length}
                onClick={revealNextFinalGroup}
              >
                Odkrýt další umístění
              </button>
              <button type="button" onClick={() => setIsFinalDialogOpen(false)}>
                Zpět na tabuli
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export function PlayPage({ gameId, isActive = true, onExit }: PlayPageProps) {
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

  return <PresenterView game={game} isActive={isActive} onExit={onExit} />;
}

export default PlayPage;

