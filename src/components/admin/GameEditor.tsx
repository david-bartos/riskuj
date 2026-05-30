import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type {
  AudioAsset,
  Category,
  CommonDenominatorItem,
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
import {
  GameJsonValidationError,
  parseGameJson,
  serializeGameToJson
} from "../../importExport/gameJson";
import TeamSetup from "../game/TeamSetup";

const questionPoints: QuestionPoints[] = [100, 200, 300, 400, 500];

function createDefaultTeams() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Tým ${index + 1}`
  }));
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type EditableGame = Game & {
  listeningGenres: ListeningGenre[];
  listeningItems: ListeningItem[];
  commonDenominator: NonNullable<Game["commonDenominator"]>;
  commonDenominatorItems: CommonDenominatorItem[];
};

type AudioEditorProps = {
  audioAssets: AudioAsset[];
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
};

export function normalizeGame(game: Game): EditableGame {
  const commonRound = game.rounds.find((round) => round.type === "common-denominator");
  const commonDenominatorItems =
    commonRound?.type === "common-denominator" && commonRound.items?.length
      ? commonRound.items
      : [
          {
            id: "common-denominator-1",
            title: "Společný jmenovatel 1",
            value: (commonRound?.points ?? 5000) as CommonDenominatorItem["value"],
            answer: game.commonDenominator?.answer ?? commonRound?.answer ?? "",
            clues: game.commonDenominator?.clues ?? commonRound?.clues ?? [],
            moderatorNote: commonRound?.moderatorNote
          }
        ];

  return {
    ...game,
    teams: game.teams.length > 0 ? game.teams : createDefaultTeams(),
    listeningGenres: game.listeningGenres ?? [],
    listeningItems: game.listeningItems ?? [],
    commonDenominator: game.commonDenominator ?? { answer: "", clues: [] },
    commonDenominatorItems
  };
}

export function createEmptyGame(): Game {
  const firstCategoryId = makeId("category");
  const firstGenreId = makeId("genre");

  const now = new Date().toISOString();

  return {
    id: makeId("game"),
    title: "Nová hra",
    teams: createDefaultTeams(),
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
        answer: game.commonDenominatorItems[0]?.answer ?? game.commonDenominator.answer,
        moderatorNote: commonRound?.moderatorNote,
        clues: (game.commonDenominatorItems[0]?.clues ?? game.commonDenominator.clues).map((clue, index) => ({
          ...clue,
          order: clue.order ?? index + 1,
          prompt: clue.prompt ?? clue.text ?? ""
        })),
        items: game.commonDenominatorItems.map((item) => ({
          ...item,
          clues: item.clues.map((clue, index) => ({
            ...clue,
            order: clue.order ?? index + 1,
            prompt: clue.prompt ?? clue.text ?? ""
          }))
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
  if (game.commonDenominatorItems.some((item) => !item.title.trim())) {
    messages.push("Položka třetího kola musí mít vyplněný název.");
  }
  if (!game.commonDenominator.answer.trim() && game.commonDenominatorItems.length === 0) {
    messages.push("Třetí kolo musí mít vyplněný společný jmenovatel.");
  }
  if (game.commonDenominatorItems.some((item) => !item.answer.trim())) {
    messages.push("Každá položka třetího kola musí mít vyplněný společný jmenovatel.");
  }
  if (game.commonDenominator.clues.some((clue) => !(clue.text ?? "").trim())) {
    messages.push("Indicie ve třetím kole nesmí být prázdná.");
  }
  if (
    game.commonDenominatorItems.some((item) =>
      item.clues.some((clue) => !(clue.text ?? clue.prompt ?? "").trim())
    )
  ) {
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

  function updateCommonDenominatorItem(nextItem: CommonDenominatorItem) {
    setGame((current) => ({
      ...current,
      commonDenominatorItems: current.commonDenominatorItems.map((item) =>
        item.id === nextItem.id ? nextItem : item
      ),
      commonDenominator:
        current.commonDenominatorItems[0]?.id === nextItem.id
          ? { answer: nextItem.answer, clues: nextItem.clues }
          : current.commonDenominator
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

  function addCommonDenominatorItem() {
    setGame((current) => {
      const nextNumber = current.commonDenominatorItems.length + 1;
      const item: CommonDenominatorItem = {
        id: makeId("common"),
        title: `Společný jmenovatel ${nextNumber}`,
        value: 5000,
        answer: "",
        clues: [{ id: makeId("clue"), text: "", prompt: "", order: 1 }]
      };

      return {
        ...current,
        commonDenominatorItems: [...current.commonDenominatorItems, item]
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

  function handleExportJson() {
    const preparedGame = prepareGameForSave(game);
    const blob = new Blob([serializeGameToJson(preparedGame)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(preparedGame.title)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      "Import nahradí aktuálně otevřenou hru a hned ji uloží. Pokračovat?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const importedGame = parseGameJson(await readFileAsText(file));
      const normalizedGame = normalizeGame(importedGame);
      setErrors([]);
      await onSave(prepareGameForSave(normalizedGame));
      setGame(normalizedGame);
    } catch (error) {
      const message =
        error instanceof GameJsonValidationError || error instanceof Error
          ? error.message
          : "Import se nepodařil.";
      setErrors([message]);
    }
  }

  return (
    <form className="editor-form" aria-label="Editor hry" onSubmit={handleSubmit}>
      <section className="editor-section">
        <div className="section-heading-row">
          <h2>Import a export</h2>
          <div className="inline-actions">
            <button type="button" onClick={handleExportJson}>
              Exportovat JSON
            </button>
            <label className="button-like">
              <span>Importovat JSON</span>
              <input
                aria-label="Importovat JSON hry"
                accept="application/json,.json"
                type="file"
                onChange={(event) => void handleImportJson(event)}
              />
            </label>
          </div>
        </div>
      </section>

      <label className="field-stack">
        <span>Název hry</span>
        <input
          value={game.title}
          onChange={(event) =>
            setGame((current) => ({ ...current, title: event.target.value }))
          }
        />
      </label>

      <TeamSetup
        teams={game.teams}
        onChange={(teams) => setGame((current) => ({ ...current, teams }))}
      />

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
        <div className="section-heading-row">
          <h2>Třetí kolo: společný jmenovatel</h2>
          <button className="button-compact" type="button" onClick={addCommonDenominatorItem}>
            Přidat společný jmenovatel
          </button>
        </div>
        <div className="item-list">
          {game.commonDenominatorItems.map((item, index) => (
            <article className="editor-card" key={item.id}>
              <label className="field-stack">
                <span>{`Název položky společného jmenovatele ${index + 1}`}</span>
                <input
                  value={item.title}
                  onChange={(event) =>
                    updateCommonDenominatorItem({ ...item, title: event.target.value })
                  }
                />
              </label>
              <CommonDenominatorEditor
                round={{ answer: item.answer, clues: item.clues }}
                onChange={(commonDenominator) =>
                  updateCommonDenominatorItem({
                    ...item,
                    answer: commonDenominator.answer,
                    clues: commonDenominator.clues
                  })
                }
                audioAssets={audioAssets}
                onUploadAudio={onUploadAudio}
                onAddClue={() =>
                  updateCommonDenominatorItem({
                    ...item,
                    clues: [...item.clues, { id: makeId("clue"), text: "" }]
                  })
                }
                onRemoveClue={(clueId) =>
                  updateCommonDenominatorItem({
                    ...item,
                    clues: item.clues.filter((clue) => clue.id !== clueId)
                  })
                }
              />
            </article>
          ))}
        </div>
      </section>

      <div className="inline-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Ukládám..." : "Uložit hru"}
        </button>
      </div>
    </form>
  );
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "riskuj-hra";
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Soubor nejde přečíst.")));
    reader.readAsText(file);
  });
}
