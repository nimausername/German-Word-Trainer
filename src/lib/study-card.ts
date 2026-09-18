/**
 * Learner-facing helpers for German→Persian study cards.
 */

export type StudyCardWord = {
  lemma: string;
  pos: string;
  article: string | null;
  singular: string;
  plural: string | null;
  glossFa: string;
  descriptionFa: string;
};

export type ScriptRun = {
  lang: "fa" | "de";
  value: string;
};

const POS_LABELS: Record<string, string> = {
  noun: "Noun",
  verb: "Verb",
  adj: "Adjective",
  adv: "Adverb",
  prep: "Preposition",
  pron: "Pronoun",
  conj: "Conjunction",
  article: "Article",
  num: "Number",
  particle: "Particle",
};

const GENDER_FA: Record<string, string> = {
  der: "مذکر",
  die: "مؤنث",
  das: "خنثی",
};

const LATIN_TOKEN_RE =
  /[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9\-'’]*/g;

const REDUNDANT_NOTE_RE =
  /^(اسم(?:\s+(?:مذکر|مؤنث|خنثی))?|فعل|صفت|قید|حرف\s+اضافه|ضمیر|حرف\s+ربط|حرف\s+تعریف|عدد|جزء\s+کلام|واژهٔ\s+پرکاربرد)[.٫]?\s*$/u;

/**
 * Returns a short English part-of-speech label for the card chrome.
 */
export const formatPosLabel = (pos: string) => POS_LABELS[pos] ?? pos;

/**
 * Returns the classic German-learner color class for der/die/das.
 */
export const articleToneClass = (article: string | null) => {
  if (article === "der") {
    return "text-blue-600 dark:text-blue-400";
  }
  if (article === "die") {
    return "text-rose-600 dark:text-rose-400";
  }
  if (article === "das") {
    return "text-emerald-600 dark:text-emerald-400";
  }
  return "";
};

/**
 * Returns the Persian gender word for a German article.
 */
export const formatGenderFa = (article: string | null) =>
  article ? (GENDER_FA[article] ?? null) : null;

/**
 * Splits a Persian gloss into a primary meaning and extra senses.
 */
export const splitGlosses = (glossFa: string) => {
  const parts = glossFa
    .split(/\s*؛\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    primary: parts[0] ?? glossFa,
    extras: parts.slice(1),
  };
};

/**
 * Splits mixed Persian/German text so each German token can be isolated LTR.
 * Trailing Latin periods after a German word are dropped — they break RTL.
 */
export const splitMixedScript = (text: string): ScriptRun[] => {
  const trimmed = text.replace(/[.．٫]+\s*$/u, "").trim();
  if (!trimmed) {
    return [];
  }

  const runs: ScriptRun[] = [];
  let cursor = 0;
  for (const match of trimmed.matchAll(LATIN_TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      const fa = normalizeFaRun(trimmed.slice(cursor, index));
      if (fa) {
        runs.push({ lang: "fa", value: fa });
      }
    }
    runs.push({ lang: "de", value: match[0] });
    cursor = index + match[0].length;
  }

  if (cursor < trimmed.length) {
    const fa = normalizeFaRun(trimmed.slice(cursor));
    if (fa) {
      runs.push({ lang: "fa", value: fa });
    }
  }

  return runs;
};

/**
 * Removes leftover Latin punctuation that would flip to the wrong side in RTL.
 */
const normalizeFaRun = (value: string) =>
  value
    .replace(/^[\s.,;:]+/u, " ")
    .replace(/[\s.,;:]+$/u, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Drops notes that only repeat POS, gender, or plural already shown as facts.
 */
export const cleanLearnerNote = (
  descriptionFa: string,
  plural: string | null,
) => {
  let note = descriptionFa.trim();
  if (!note) {
    return "";
  }

  if (plural) {
    note = note
      .replace(new RegExp(`جمع:\\s*${escapeRegExp(plural)}[.٫]?`, "u"), " ")
      .trim();
  }

  note = note.replace(/[.．]+\s*$/u, "").trim();
  if (!note || REDUNDANT_NOTE_RE.test(note)) {
    return "";
  }

  return note;
};

/**
 * Returns true when the lemma adds information beyond the shown German form.
 */
export const shouldShowLemma = (word: StudyCardWord, front: string) => {
  const lemma = word.lemma.trim();
  const shown = front.trim();
  if (!lemma || lemma === shown) {
    return false;
  }
  if (word.article && shown === `${word.article} ${word.singular}`.trim()) {
    return lemma !== word.singular && lemma !== shown;
  }
  return lemma !== word.singular;
};

/**
 * Formats the German prompt shown on the front of the card.
 */
export const formatGermanFront = (word: StudyCardWord) => {
  if (word.article && word.singular) {
    return {
      article: word.article,
      headword: word.singular,
    };
  }
  return {
    article: null,
    headword: word.singular || word.lemma,
  };
};

/**
 * Escapes a string for use in a `RegExp`.
 */
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
