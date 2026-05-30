import { GameBoard } from "../components/game/GameBoard";
import { demoGame } from "../data/demoGame";
import { useGameSession } from "../hooks/useGameSession";

type PlayPageProps = {
  gameId: string;
};

export function PlayPage({ gameId }: PlayPageProps) {
  const session = useGameSession(gameId);

  return (
    <main className="app-shell app-shell--game">
      <section className="play-header" aria-labelledby="play-title">
        <p className="intro-kicker">Demo hra</p>
        <h1 id="play-title">Herní tabule</h1>
        <p className="intro-text">
          Vyberte políčko s hodnotou. Použitá políčka zůstanou na tabuli
          viditelná a ztlumená.
        </p>
      </section>

      <GameBoard
        game={demoGame}
        currentQuestionId={session.currentQuestionId}
        revealedQuestionIds={session.revealedQuestionIds}
        onSelectQuestion={session.selectTile}
      />
    </main>
  );
}
