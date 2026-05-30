import { useEffect, useMemo, useState } from "react";
import { GameBoard } from "../components/game/GameBoard";
import { demoGame } from "../data/demoGame";
import { useGameSession } from "../hooks/useGameSession";

type PlayPageProps = {
  gameId: string;
};

const supportedGameId = "demo";

export function PlayPage({ gameId }: PlayPageProps) {
  const session = useGameSession(gameId);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const selectedQuestion = useMemo(
    () =>
      demoGame.questions.find(
        (question) => question.id === session.currentQuestionId
      ),
    [session.currentQuestionId]
  );
  const selectedCategory = useMemo(
    () =>
      selectedQuestion
        ? demoGame.categories.find(
            (category) => category.id === selectedQuestion.categoryId
          )
        : undefined,
    [selectedQuestion]
  );

  useEffect(() => {
    setIsAnswerVisible(false);
  }, [session.currentQuestionId]);

  if (gameId !== supportedGameId) {
    return (
      <section
        className="page-panel page-panel-wide play-page"
        aria-labelledby="play-title"
      >
        <p className="eyebrow">Demo hra</p>
        <h1 id="play-title">Hra nenalezena</h1>
        <p className="page-copy">Hra "{gameId}" zatím není dostupná.</p>
      </section>
    );
  }

  const completeQuestion = () => {
    session.markQuestionUsed();
    session.clearCurrentQuestion();
  };

  if (selectedQuestion && selectedCategory) {
    return (
      <section
        className="page-panel page-panel-wide play-page question-page"
        aria-labelledby="play-title"
      >
        <p className="eyebrow">Otázka</p>
        <h1 id="play-title">
          {selectedCategory.title} za {selectedQuestion.points} bodů
        </h1>
        <article className="question-card">
          <p className="question-prompt">{selectedQuestion.prompt}</p>
          {selectedQuestion.audio ? (
            <div className="question-audio" aria-label="Hudební ukázka">
              <strong>{selectedQuestion.audio.title}</strong>
              {selectedQuestion.audio.durationSeconds ? (
                <span>{selectedQuestion.audio.durationSeconds} s</span>
              ) : null}
            </div>
          ) : null}
          {isAnswerVisible ? (
            <div className="answer-panel">
              <p className="answer-label">Odpověď</p>
              <p className="answer-text">{selectedQuestion.answer}</p>
              {selectedQuestion.moderatorNote ? (
                <p className="moderator-note">{selectedQuestion.moderatorNote}</p>
              ) : null}
            </div>
          ) : null}
        </article>
        <div className="question-actions">
          <button
            className="button-secondary"
            type="button"
            onClick={session.clearCurrentQuestion}
          >
            Zpět na tabuli
          </button>
          {!isAnswerVisible ? (
            <button
              className="button-primary"
              type="button"
              onClick={() => setIsAnswerVisible(true)}
            >
              Zobrazit odpověď
            </button>
          ) : null}
          <button className="button-primary" type="button" onClick={completeQuestion}>
            Správně
          </button>
          <button className="button-secondary" type="button" onClick={completeQuestion}>
            Špatně
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="page-panel page-panel-wide play-page"
      aria-labelledby="play-title"
    >
      <p className="eyebrow">Demo hra</p>
      <h1 id="play-title">Herní tabule</h1>
      <p className="game-code">Kód hry: {gameId}</p>
      <p className="page-copy">
        Vyberte políčko s bodovou hodnotou. Použitá políčka zůstanou na tabuli
        viditelná a ztlumená.
      </p>
      <div className="presenter-toolbar" aria-label="Ovládání tabule">
        <button
          className="button-secondary"
          type="button"
          onClick={session.resetSession}
        >
          Resetovat tabuli
        </button>
      </div>
      <GameBoard
        game={demoGame}
        currentQuestionId={session.currentQuestionId}
        revealedQuestionIds={session.revealedQuestionIds}
        onSelectQuestion={session.selectTile}
      />
    </section>
  );
}
