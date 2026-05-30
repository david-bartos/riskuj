import type {
  AudioAsset,
  CommonDenominatorClue,
  Game,
  GameRound,
  ListeningItem,
  Question
} from "../types/game";

const currentFormat = "riskuj-game/v1";

type GameJsonV1 = {
  format: typeof currentFormat;
  exportedAt: string;
  game: Game;
};

export class GameJsonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameJsonValidationError";
  }
}

export function serializeGameToJson(game: Game): string {
  const payload: GameJsonV1 = {
    format: currentFormat,
    exportedAt: new Date().toISOString(),
    game
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseGameJson(text: string): Game {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    throw new GameJsonValidationError("Soubor není platný JSON.");
  }

  assertRecord(value, "");

  if (value.format !== currentFormat) {
    const format = typeof value.format === "string" ? value.format : "neznámý";
    throw new GameJsonValidationError(
      `Nepodporovaný formát importu: ${format}. Očekává se ${currentFormat}.`
    );
  }

  assertString(value.exportedAt, "exportedAt");
  assertRecord(value.game, "game");
  validateGame(value.game, "game");

  return value.game as unknown as Game;
}

function validateGame(value: Record<string, unknown>, path: string) {
  assertString(value.id, `${path}.id`);
  assertString(value.title, `${path}.title`);
  assertString(value.createdAt, `${path}.createdAt`);
  assertString(value.updatedAt, `${path}.updatedAt`);
  assertArray(value.teams, `${path}.teams`);
  assertArray(value.rounds, `${path}.rounds`);
  assertArray(value.categories, `${path}.categories`);
  assertArray(value.questions, `${path}.questions`);

  validateUniqueIds(value.teams, `${path}.teams`);
  validateUniqueIds(value.categories, `${path}.categories`);
  validateQuestions(value.questions, `${path}.questions`);
  validateRounds(value.rounds, `${path}.rounds`);

  if (value.listeningGenres !== undefined) {
    assertArray(value.listeningGenres, `${path}.listeningGenres`);
    validateUniqueIds(value.listeningGenres, `${path}.listeningGenres`);
  }

  if (value.listeningItems !== undefined) {
    assertArray(value.listeningItems, `${path}.listeningItems`);
    validateListeningItems(value.listeningItems, `${path}.listeningItems`);
  }

  if (value.commonDenominator !== undefined) {
    assertRecord(value.commonDenominator, `${path}.commonDenominator`);
    assertString(value.commonDenominator.answer, `${path}.commonDenominator.answer`);
    assertArray(value.commonDenominator.clues, `${path}.commonDenominator.clues`);
    validateCommonClues(value.commonDenominator.clues, `${path}.commonDenominator.clues`);
  }
}

function validateRounds(rounds: unknown[], path: string) {
  validateUniqueIds(rounds, path);

  rounds.forEach((round, index) => {
    const roundPath = `${path}[${index}]`;
    assertRecord(round, roundPath);
    assertString(round.id, `${roundPath}.id`);
    assertString(round.title, `${roundPath}.title`);
    assertString(round.type, `${roundPath}.type`);

    if (round.type === "question") {
      assertArray(round.categories, `${roundPath}.categories`);
      assertArray(round.questions, `${roundPath}.questions`);
      validateUniqueIds(round.categories, `${roundPath}.categories`);
      validateQuestions(round.questions, `${roundPath}.questions`);
      return;
    }

    if (round.type === "listening") {
      assertArray(round.categories, `${roundPath}.categories`);
      assertArray(round.tracks, `${roundPath}.tracks`);
      validateUniqueIds(round.categories, `${roundPath}.categories`);
      validateListeningItems(round.tracks, `${roundPath}.tracks`);
      return;
    }

    if (round.type === "common-denominator") {
      assertString(round.answer, `${roundPath}.answer`);
      assertArray(round.clues, `${roundPath}.clues`);
      validateCommonClues(round.clues, `${roundPath}.clues`);
      return;
    }

    throw new GameJsonValidationError(
      `Neplatný typ kola v ${roundPath}.type. Použijte question, listening nebo common-denominator.`
    );
  });
}

function validateQuestions(questions: unknown[], path: string) {
  validateUniqueIds(questions, path);

  questions.forEach((question, index) => {
    const questionPath = `${path}[${index}]`;
    assertRecord(question, questionPath);
    assertString(question.id, `${questionPath}.id`);
    assertString(question.categoryId, `${questionPath}.categoryId`);
    assertNumber(question.points, `${questionPath}.points`);
    assertString(question.prompt, `${questionPath}.prompt`);
    assertString(question.answer, `${questionPath}.answer`);
    validateOptionalAudio(question as unknown as Question, `${questionPath}.audio`);
  });
}

function validateListeningItems(items: unknown[], path: string) {
  validateUniqueIds(items, path);

  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    assertRecord(item, itemPath);
    assertString(item.id, `${itemPath}.id`);
    assertString(item.prompt, `${itemPath}.prompt`);
    assertString(item.answer, `${itemPath}.answer`);
    validateOptionalAudio(item as unknown as ListeningItem, `${itemPath}.audio`);
  });
}

function validateCommonClues(clues: unknown[], path: string) {
  validateUniqueIds(clues, path);

  clues.forEach((clue, index) => {
    const cluePath = `${path}[${index}]`;
    assertRecord(clue, cluePath);
    assertString(clue.id, `${cluePath}.id`);
    if (clue.prompt !== undefined) {
      assertString(clue.prompt, `${cluePath}.prompt`);
    }
    if (clue.text !== undefined) {
      assertString(clue.text, `${cluePath}.text`);
    }
    validateOptionalAudio(clue as unknown as CommonDenominatorClue, `${cluePath}.audio`);
  });
}

function validateOptionalAudio(value: Question | ListeningItem | CommonDenominatorClue, path: string) {
  if (value.audio === undefined) {
    return;
  }

  validateAudio(value.audio, path);
}

function validateAudio(audio: AudioAsset, path: string) {
  assertRecord(audio, path);
  assertString(audio.id, `${path}.id`);
  assertString(audio.src, `${path}.src`);
  assertString(audio.title, `${path}.title`);

  if (!audio.src.startsWith("/uploads/") && !audio.src.startsWith("/demo-audio/")) {
    throw new GameJsonValidationError(
      `Neplatná cesta k audio souboru v ${path}.src. Použijte /uploads/nazev.mp3.`
    );
  }
}

function validateUniqueIds(values: unknown[], path: string) {
  const seen = new Set<string>();

  values.forEach((value) => {
    assertRecord(value, path);
    assertString(value.id, `${path}[].id`);

    if (seen.has(value.id)) {
      throw new GameJsonValidationError(`Duplicitní ID v ${path}: ${value.id}.`);
    }

    seen.add(value.id);
  });
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new GameJsonValidationError(`Chybí povinné pole ${path || "root"}.`);
  }
}

function assertArray(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new GameJsonValidationError(`Chybí povinné pole ${path}.`);
  }
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new GameJsonValidationError(`Chybí povinné pole ${path}.`);
  }
}

function assertNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new GameJsonValidationError(`Chybí povinné pole ${path}.`);
  }
}
