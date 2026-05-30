import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  AudioAsset,
  Category,
  Game,
  ListeningGenre,
  ListeningItem,
  Question,
  QuestionPoints
} from "../../types/game";
import CategoryEditor from "./CategoryEditor";
import {
  CommonDenominatorEditor,
  FirstRoundQuestionEditor,
  ListeningItemEditor
} from "./QuestionEditor";

const questionPoints: QuestionPoints[] = [100, 200, 300, 400, 500];

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type EditableGame = Game & {
  listeningGenres: ListeningGenre[];
  listeningItems: ListeningItem[];
  commonDenominator: NonNullable<Game["commonDenominator"]>;
};

type AudioEditorProps = {
  audioAssets: AudioAsset[];
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
};

export function normalizeGame(game: Game): EditableGame {
  return {
    ...game,
    listeningGenres: game.listeningGenres ?? [],
    listeningItems: game.listeningItems ?? [],
    commonDenominator: game.commonDenominator ?? { answer: "", clues: [] }
  };
}

export function createEmptyGame(): Game {
  const firstCategoryId = makeId("category");
  const firstGenreId = makeId("genre");

  const now = new Date().toISOString();

  return {
    id: makeId("game"),
    title: "Nová hra",
    teams: [],
    rounds: [],
    createdAt: now,
    updatedAt: now,
    categories: [{ id: firstCategoryId, title: "Nová kategorie" }],
    questions: questionPoints.map((points) => ({
      id: makeId("question"),
      categoryId: firstCategoryId,
      points,
      prompt: "",
      answer: ""
    })),
    listeningGenres: [{ id: firstGenreId, title: "Nový žánr" }],
    listeningItems: [],
    commonDenominator: {
      answer: "",
      clues: []
    }
  };
}

export function prepareGameForSave(game: EditableGame): Game {
  const questionRound = game.rounds.find((round) => round.type === "question");
  const listeningRound = game.rounds.find((round) => round.type === "listening");
  const commonRound = game.rounds.find((round) => round.type === "common-denominator");

  return {
    ...game,
    rounds: [
      {
        id: questionRound?.id ?? "round-otazky",
        type: "question",
        title: questionRound?.title ?? "Riskuj",
        categories: game.categories,
        questions: game.questions,
        items: game.questions
      },
      {
        id: listeningRound?.id ?? "round-poslech",
        type: "listening",
        title: listeningRound?.title ?? "Poslechové kolo",
        categories: game.listeningGenres,
        tracks: game.listeningItems.map((item) => ({
          ...item,
          categoryId: item.categoryId ?? item.genreId ?? game.listeningGenres[0]?.id ?? "",
          genreId: item.genreId ?? item.categoryId,
          points: item.points ?? 100,
          trackTitleAnswer: item.trackTitleAnswer ?? item.title ?? item.answer,
          artistAnswer: item.artistAnswer ?? item.artist ?? "",
          audioUrl: item.audio?.src ?? item.audioUrl
        })),
        items: game.listeningItems
      },
      {
        id: commonRound?.id ?? "round-spolecny-jmenovatel",
        type: "common-denominator",
        title: commonRound?.title ?? "Společný jmenovatel",
        points: commonRound?.points ?? 300,
        answer: game.commonDenominator.answer,
        moderatorNote: commonRound?.moderatorNote,
        clues: game.commonDenominator.clues.map((clue, index) => ({
          ...clue,
          order: clue.order ?? index + 1,
          prompt: clue.prompt ?? clue.text ?? ""
        }))
      }
    ]
  };
}

export function validateGame(game: EditableGame): string[] {
  const messages: string[] = [];

  if (!game.title.trim()) {
    messages.push("Název hry nesmí být prázdný.");
  }
  if (game.categories.some((category) => !category.title.trim())) {
    messages.push("Název kategorie nesmí být prázdný.");
  }
  if (game.listeningGenres.some((genre) => !genre.title.trim())) {
    messages.push("Název žánru nesmí být prázdný.");
  }
  if (game.questions.some((question) => !question.prompt.trim() || !question.answer.trim())) {
    messages.push("Otázka musí mít vyplněné zadání i odpověď.");
  }
  if (game.listeningItems.some((item) => !item.prompt.trim() || !item.answer.trim())) {
    messages.push("Poslechová položka musí mít zadání i odpověď.");
  }
  if (!game.commonDenominator.answer.trim()) {
    messages.push("Třetí kolo musí mít vyplněný společný jmenovatel.");
  }
  if (game.commonDenominator.clues.some((clue) => !(clue.text ?? "").trim())) {
    messages.push("Indicie ve třetím kole nesmí být prázdná.");
  }

  return messages;
}

type GameEditorProps = {
  initialGame: Game;
  audioAssets?: AudioAsset[];
  isSaving?: boolean;
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
  onSave: (game: Game) => void | Promise<void>;
};

export default function GameEditor({
  initialGame,
  audioAssets = [],
  isSaving = false,
  onUploadAudio,
  onSave
}: GameEditorProps) {
  const [game, setGame] = useState(() => normalizeGame(initialGame));
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setGame(normalizeGame(initialGame));
    setErrors([]);
  }, [initialGame]);

  const questionsByCategory = useMemo(() => {
    return game.categories.map((category) => ({
      category,
      questions: game.questions
        .filter((question) => question.categoryId === category.id)
        .sort((left, right) => left.points - right.points)
    }));
  }, [game.categories, game.questions]);

  function updateQuestion(nextQuestion: Question) {
    setGame((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === nextQuestion.id ? nextQuestion : question
      )
    }));
  }

  function updateListeningItem(nextItem: ListeningItem) {
    setGame((current) => ({
      ...current,
      listeningItems: current.listeningItems.map((item) =>
        item.id === nextItem.id ? nextItem : item
      )
    }));
  }

  function addCategory() {
    const category: Category = { id: makeId("category"), title: "Nová kategorie" };
    const questions: Question[] = questionPoints.map((points) => ({
      id: makeId("question"),
      categoryId: category.id,
      points,
      prompt: "",
      answer: ""
    }));

    setGame((current) => ({
      ...current,
      categories: [...current.categories, category],
      questions: [...current.questions, ...questions]
    }));
  }

  function addGenre(): ListeningGenre {
    const genre = { id: makeId("genre"), title: "Nový žánr" };
    setGame((current) => ({
      ...current,
      listeningGenres: [...current.listeningGenres, genre]
    }));
    return genre;
  }

  function addListeningItem() {
    setGame((current) => {
      const existingGenre = current.listeningGenres[0];
      const genre = existingGenre ?? { id: makeId("genre"), title: "Nový žánr" };
      const nextGenres = existingGenre ? current.listeningGenres : [genre];

      return {
        ...current,
        listeningGenres: nextGenres,
        listeningItems: [
          ...current.listeningItems,
          {
            id: makeId("listen"),
            genreId: genre.id,
            title: "",
            artist: "",
            prompt: "",
            answer: ""
          }
        ]
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateGame(game);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    await onSave(prepareGameForSave(game));
  }

  return (
    <form className="editor-form" aria-label="Editor hry" onSubmit={handleSubmit}>
      <label className="field-stack">
        <span>Název hry</span>
        <input
          value={game.title}
          onChange={(event) =>
            setGame((current) => ({ ...current, title: event.target.value }))
          }
        />
      </label>

      {errors.length > 0 ? (
        <div className="form-message form-message-error" role="alert">
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="editor-section">
        <h2>První kolo</h2>
        <CategoryEditor
          title="Kategorie prvního kola"
          addLabel="Přidat kategorii"
          emptyLabel="Zatím nejsou přidané žádné kategorie."
          deleteMessage="Smazáním kategorie se smažou i její otázky. Pokračovat?"
          groups={game.categories}
          onAdd={addCategory}
          onRename={(categoryId, title) =>
            setGame((current) => ({
              ...current,
              categories: current.categories.map((category) =>
                category.id === categoryId ? { ...category, title } : category
              )
            }))
          }
          onRemove={(categoryId) =>
            setGame((current) => ({
              ...current,
              categories: current.categories.filter((category) => category.id !== categoryId),
              questions: current.questions.filter((question) => question.categoryId !== categoryId)
            }))
          }
        />
        {questionsByCategory.map(({ category, questions }) => (
          <section className="editor-section nested-section" key={category.id}>
            <h3>{category.title || "Kategorie bez názvu"}</h3>
            <div className="item-list">
              {questions.map((question) => (
                <FirstRoundQuestionEditor
                  key={question.id}
                  question={question}
                  categoryTitle={category.title || "bez názvu"}
                  audioAssets={audioAssets}
                  onChange={updateQuestion}
                  onUploadAudio={onUploadAudio}
                />
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="editor-section">
        <h2>Druhé kolo: poslech</h2>
        <CategoryEditor
          title="Žánry poslechového kola"
          addLabel="Přidat žánr"
          emptyLabel="Zatím nejsou přidané žádné žánry."
          deleteMessage="Smazáním žánru se smažou i jeho poslechové položky. Pokračovat?"
          groups={game.listeningGenres}
          onAdd={addGenre}
          onRename={(genreId, title) =>
            setGame((current) => ({
              ...current,
              listeningGenres: current.listeningGenres.map((genre) =>
                genre.id === genreId ? { ...genre, title } : genre
              )
            }))
          }
          onRemove={(genreId) =>
            setGame((current) => ({
              ...current,
              listeningGenres: current.listeningGenres.filter((genre) => genre.id !== genreId),
              listeningItems: current.listeningItems.filter((item) => item.genreId !== genreId)
            }))
          }
        />
        <div className="section-heading-row">
          <h3>Poslechové položky</h3>
          <button className="button-compact" type="button" onClick={addListeningItem}>
            Přidat poslechovou položku
          </button>
        </div>
        <div className="item-list">
          {game.listeningItems.map((item) => (
            <ListeningItemEditor
              key={item.id}
              item={item}
              genres={game.listeningGenres}
              audioAssets={audioAssets}
              onChange={updateListeningItem}
              onUploadAudio={onUploadAudio}
              onRemove={() =>
                setGame((current) => ({
                  ...current,
                  listeningItems: current.listeningItems.filter((currentItem) => currentItem.id !== item.id)
                }))
              }
            />
          ))}
        </div>
      </section>

      <section className="editor-section">
        <h2>Třetí kolo: společný jmenovatel</h2>
        <CommonDenominatorEditor
          round={game.commonDenominator}
          onChange={(commonDenominator) =>
            setGame((current) => ({ ...current, commonDenominator }))
          }
          audioAssets={audioAssets}
          onUploadAudio={onUploadAudio}
          onAddClue={() =>
            setGame((current) => ({
              ...current,
              commonDenominator: {
                ...current.commonDenominator,
                clues: [
                  ...current.commonDenominator.clues,
                  { id: makeId("clue"), text: "" }
                ]
              }
            }))
          }
          onRemoveClue={(clueId) =>
            setGame((current) => ({
              ...current,
              commonDenominator: {
                ...current.commonDenominator,
                clues: current.commonDenominator.clues.filter((clue) => clue.id !== clueId)
              }
            }))
          }
        />
      </section>

      <div className="inline-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Ukládám..." : "Uložit hru"}
        </button>
      </div>
    </form>
  );
}
