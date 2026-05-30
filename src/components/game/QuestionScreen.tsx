import { useState } from "react";
import type { Category, Question } from "../../types/game";

export type QuestionOutcome = "correct" | "wrong";

export type QuestionScreenProps = {
  category: Category;
  question: Question;
  onComplete: (outcome: QuestionOutcome) => void;
  onBackToBoard: () => void;
};

export default function QuestionScreen({
  category,
  question,
  onComplete,
  onBackToBoard
}: QuestionScreenProps) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  return (
    <section className="question-screen" aria-labelledby="question-screen-title">
      <div className="question-screen__meta">
        <div>
          <p className="stage-label">Otázka</p>
          <h1 id="question-screen-title">{category.title}</h1>
        </div>
        <strong className="question-screen__points">{question.points} bodů</strong>
      </div>

      <p className="question-screen__prompt">{question.prompt}</p>

      {question.audio ? (
        <section className="question-screen__audio" aria-label="Hudební ukázka">
          <p className="stage-label">Audio</p>
          <h2>{question.audio.title}</h2>
          <audio controls src={question.audio.src}>
            Váš prohlížeč nepodporuje přehrávání audia.
          </audio>
        </section>
      ) : null}

      {isAnswerRevealed ? (
        <section className="question-screen__answer" aria-label="Odpověď">
          <p className="stage-label">Odpověď</p>
          <p>{question.answer}</p>
        </section>
      ) : null}

      <div className="question-screen__controls">
        {!isAnswerRevealed ? (
          <button type="button" onClick={() => setIsAnswerRevealed(true)}>
            Zobrazit odpověď
          </button>
        ) : null}

        <div className="question-screen__result-actions">
          <button
            type="button"
            disabled={!isAnswerRevealed}
            onClick={() => onComplete("correct")}
          >
            Správně
          </button>
          <button
            type="button"
            disabled={!isAnswerRevealed}
            onClick={() => onComplete("wrong")}
          >
            Špatně
          </button>
        </div>

        <button className="question-screen__back" type="button" onClick={onBackToBoard}>
          Zpět na tabuli
        </button>
      </div>
    </section>
  );
}
