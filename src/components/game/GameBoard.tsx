import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Game, Question, QuestionPoints } from "../../types/game";
import { ScoreTile, type ScoreTileState } from "./ScoreTile";

type GameBoardProps = {
  game: Game;
  currentQuestionId: string | null;
  revealedQuestionIds: string[];
  onSelectQuestion: (questionId: string) => void;
};

function getQuestionKey(categoryId: string, points: QuestionPoints) {
  return `${categoryId}:${points}`;
}

function getTileState(
  question: Question | undefined,
  currentQuestionId: string | null,
  revealedQuestionIds: Set<string>
): ScoreTileState {
  if (!question) {
    return "disabled";
  }

  if (revealedQuestionIds.has(question.id)) {
    return "used";
  }

  if (question.id === currentQuestionId) {
    return "active";
  }

  return "available";
}

export function GameBoard({
  game,
  currentQuestionId,
  revealedQuestionIds,
  onSelectQuestion
}: GameBoardProps) {
  const pointRows = useMemo(
    () =>
      Array.from(new Set(game.questions.map((question) => question.points))).sort(
        (first, second) => first - second
      ),
    [game.questions]
  );
  const questionsByCell = useMemo(
    () =>
      new Map(
        game.questions.map((question) => [
          getQuestionKey(question.categoryId, question.points),
          question
        ])
      ),
    [game.questions]
  );
  const revealedIds = useMemo(
    () => new Set(revealedQuestionIds),
    [revealedQuestionIds]
  );

  return (
    <section className="game-board-panel" aria-labelledby="game-board-title">
      <h2 id="game-board-title">{game.title}</h2>
      <div
        className="game-board"
        role="grid"
        aria-label={`Herní tabule ${game.title}`}
        style={{ "--board-columns": game.categories.length } as CSSProperties}
      >
        {game.categories.map((category) => (
          <div className="category-tile" role="columnheader" key={category.id}>
            {category.title}
          </div>
        ))}

        {pointRows.flatMap((points) =>
          game.categories.map((category) => {
            const question = questionsByCell.get(getQuestionKey(category.id, points));

            return (
              <ScoreTile
                key={`${category.id}-${points}`}
                points={points}
                question={question}
                state={getTileState(question, currentQuestionId, revealedIds)}
                categoryTitle={category.title}
                onSelect={onSelectQuestion}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
