import type { Game, GameRoundType } from "../src/types/game";

const validRoundTypes: GameRoundType[] = ["question", "listening", "common-denominator"];

export class GameValidationError extends Error {
  constructor(public readonly details: string[]) {
    super("Hru se nepodařilo uložit.");
    this.name = "GameValidationError";
  }
}

export function validateGame(value: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return ["Hra musí být objekt."];
  }

  requireNonEmptyString(value.id, "ID hry musí být neprázdný text.", errors);
  requireNonEmptyString(value.title, "Název hry musí být neprázdný text.", errors);
  requireNonEmptyString(value.createdAt, "Datum vytvoření hry musí být neprázdný text.", errors);
  requireNonEmptyString(value.updatedAt, "Datum úpravy hry musí být neprázdný text.", errors);

  if (!Array.isArray(value.teams)) {
    errors.push("Týmy musí být pole.");
  } else {
    validateTeams(value.teams, errors);
  }

  if (!Array.isArray(value.rounds)) {
    errors.push("Kola musí být pole.");
  } else {
    validateRounds(value.rounds, errors);
  }

  return errors;
}

export function assertValidGame(value: unknown): asserts value is Game {
  const details = validateGame(value);

  if (details.length > 0) {
    throw new GameValidationError(details);
  }
}

export function createEmptyGame(title = "Nová hra", now = new Date().toISOString()): Game {
  const trimmedTitle = title.trim() || "Nová hra";
  const suffix = Math.random().toString(36).slice(2, 8);

  return {
    id: `${slugifyTitle(trimmedTitle)}-${suffix}`,
    title: trimmedTitle,
    teams: [],
    rounds: [],
    createdAt: now,
    updatedAt: now
  };
}

function validateTeams(teams: unknown[], errors: string[]) {
  const ids = new Set<string>();
  let hasDuplicateId = false;

  for (const team of teams) {
    if (!isRecord(team)) {
      errors.push("Tým musí být objekt.");
      continue;
    }

    if (!isNonEmptyString(team.id)) {
      errors.push("ID týmu musí být neprázdný text.");
    } else if (ids.has(team.id)) {
      hasDuplicateId = true;
    } else {
      ids.add(team.id);
    }

    requireNonEmptyString(team.name, "Název týmu musí být neprázdný text.", errors);
  }

  if (hasDuplicateId) {
    errors.push("ID týmů musí být unikátní.");
  }
}

function validateRounds(rounds: unknown[], errors: string[]) {
  const ids = new Set<string>();
  let hasDuplicateId = false;

  for (const round of rounds) {
    if (!isRecord(round)) {
      errors.push("Kolo musí být objekt.");
      continue;
    }

    const roundId = isNonEmptyString(round.id) ? round.id : "bez-id";

    if (!isNonEmptyString(round.id)) {
      errors.push("ID kola musí být neprázdný text.");
    } else if (ids.has(round.id)) {
      hasDuplicateId = true;
    } else {
      ids.add(round.id);
    }

    requireNonEmptyString(round.title, "Název kola musí být neprázdný text.", errors);

    if (!validRoundTypes.includes(round.type as GameRoundType)) {
      errors.push(`Kolo ${roundId} má neznámý typ.`);
      continue;
    }

    if (round.type === "question") {
      validateQuestionRound(round, errors);
    } else if (round.type === "listening") {
      validateListeningRound(round, errors);
    } else {
      validateCommonDenominatorRound(round, errors);
    }
  }

  if (hasDuplicateId) {
    errors.push("ID kol musí být unikátní.");
  }
}

function validateQuestionRound(round: Record<string, unknown>, errors: string[]) {
  if (!Array.isArray(round.categories)) {
    errors.push("Kategorie otázkového kola musí být pole.");
    return;
  }

  if (!Array.isArray(round.questions)) {
    errors.push("Otázky musí být pole.");
    return;
  }

  const categoryIds = collectCategoryIds(round.categories, "ID kategorií musí být unikátní.", errors);
  const questionIds = new Set<string>();
  let hasDuplicateQuestionId = false;

  for (const question of round.questions) {
    if (!isRecord(question)) {
      errors.push("Otázka musí být objekt.");
      continue;
    }

    const questionId = isNonEmptyString(question.id) ? question.id : "bez-id";
    if (!isNonEmptyString(question.id)) {
      errors.push("ID otázky musí být neprázdný text.");
    } else if (questionIds.has(question.id)) {
      hasDuplicateQuestionId = true;
    } else {
      questionIds.add(question.id);
    }

    if (!isNonEmptyString(question.categoryId) || !categoryIds.has(question.categoryId)) {
      errors.push(`Otázka ${questionId} odkazuje na neexistující kategorii.`);
    }

    requireFiniteNumber(question.points, "Body otázky musí být číslo.", errors);
    requireNonEmptyString(question.prompt, "Zadání otázky musí být neprázdný text.", errors);
    requireNonEmptyString(question.answer, "Odpověď otázky musí být neprázdný text.", errors);
    validateOptionalAudio(question.audio, errors);
  }

  if (hasDuplicateQuestionId) {
    errors.push("ID otázek musí být unikátní.");
  }
}

function validateListeningRound(round: Record<string, unknown>, errors: string[]) {
  if (!Array.isArray(round.categories)) {
    errors.push("Kategorie poslechového kola musí být pole.");
    return;
  }

  if (!Array.isArray(round.tracks)) {
    errors.push("Skladby musí být pole.");
    return;
  }

  const categoryIds = collectCategoryIds(round.categories, "ID kategorií musí být unikátní.", errors);
  const trackIds = new Set<string>();
  let hasDuplicateTrackId = false;

  for (const track of round.tracks) {
    if (!isRecord(track)) {
      errors.push("Skladba musí být objekt.");
      continue;
    }

    const trackId = isNonEmptyString(track.id) ? track.id : "bez-id";
    if (!isNonEmptyString(track.id)) {
      errors.push("ID skladby musí být neprázdný text.");
    } else if (trackIds.has(track.id)) {
      hasDuplicateTrackId = true;
    } else {
      trackIds.add(track.id);
    }

    if (!isNonEmptyString(track.categoryId) || !categoryIds.has(track.categoryId)) {
      errors.push(`Skladba ${trackId} odkazuje na neexistující kategorii.`);
    }

    requireFiniteNumber(track.points, "Body skladby musí být číslo.", errors);
    requireNonEmptyString(track.prompt, "Zadání skladby musí být neprázdný text.", errors);
    requireNonEmptyString(track.answer, "Odpověď skladby musí být neprázdný text.", errors);
    validateOptionalAudio(track.audio, errors);
  }

  if (hasDuplicateTrackId) {
    errors.push("ID skladeb musí být unikátní.");
  }
}

function validateCommonDenominatorRound(round: Record<string, unknown>, errors: string[]) {
  if (!Array.isArray(round.clues)) {
    errors.push("Nápovědy musí být pole.");
    return;
  }

  const clueIds = new Set<string>();
  let hasDuplicateClueId = false;

  for (const clue of round.clues) {
    if (!isRecord(clue)) {
      errors.push("Nápověda musí být objekt.");
      continue;
    }

    if (!isNonEmptyString(clue.id)) {
      errors.push("ID nápovědy musí být neprázdný text.");
    } else if (clueIds.has(clue.id)) {
      hasDuplicateClueId = true;
    } else {
      clueIds.add(clue.id);
    }

    requireFiniteNumber(clue.order, "Pořadí nápovědy musí být číslo.", errors);
    requireNonEmptyString(clue.prompt, "Text nápovědy musí být neprázdný text.", errors);
    validateOptionalAudio(clue.audio, errors);
  }

  if (hasDuplicateClueId) {
    errors.push("ID nápověd musí být unikátní.");
  }

  requireNonEmptyString(round.answer, "Společný jmenovatel musí mít odpověď.", errors);
}

function collectCategoryIds(categories: unknown[], duplicateMessage: string, errors: string[]) {
  const categoryIds = new Set<string>();
  let hasDuplicateCategoryId = false;

  for (const category of categories) {
    if (!isRecord(category)) {
      errors.push("Kategorie musí být objekt.");
      continue;
    }

    if (!isNonEmptyString(category.id)) {
      errors.push("ID kategorie musí být neprázdný text.");
    } else if (categoryIds.has(category.id)) {
      hasDuplicateCategoryId = true;
    } else {
      categoryIds.add(category.id);
    }

    requireNonEmptyString(category.title, "Název kategorie musí být neprázdný text.", errors);
  }

  if (hasDuplicateCategoryId) {
    errors.push(duplicateMessage);
  }

  return categoryIds;
}

function validateOptionalAudio(audio: unknown, errors: string[]) {
  if (audio === undefined) {
    return;
  }

  if (!isRecord(audio)) {
    errors.push("Audio musí být objekt.");
    return;
  }

  requireNonEmptyString(audio.id, "ID audia musí být neprázdný text.", errors);
  requireNonEmptyString(audio.src, "Cesta k audiu musí být neprázdný text.", errors);
}

function requireNonEmptyString(value: unknown, message: string, errors: string[]) {
  if (!isNonEmptyString(value)) {
    errors.push(message);
  }
}

function requireFiniteNumber(value: unknown, message: string, errors: string[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(message);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugifyTitle(title: string) {
  return (
    title
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "hra"
  );
}
