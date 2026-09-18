/**
 * SM-2 review ratings used by the study loop.
 */
export type ReviewRating = "again" | "hard" | "good" | "easy";

/**
 * Mutable SM-2 card scheduling state.
 */
export type Sm2State = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  nextDueAt: Date;
};

const MIN_EASE = 1.3;

const ratingQuality: Record<ReviewRating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

/**
 * Applies an SM-2 rating and returns the next scheduling state.
 */
export const applySm2Rating = (
  current: Omit<Sm2State, "nextDueAt">,
  rating: ReviewRating,
  now: Date = new Date(),
): Sm2State => {
  const quality = ratingQuality[rating];
  let { ease, intervalDays, repetitions } = current;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = rating === "easy" ? 4 : 3;
    } else {
      const hardFactor = rating === "hard" ? 1.2 : ease;
      intervalDays = Math.max(1, Math.round(intervalDays * hardFactor));
      if (rating === "easy") {
        intervalDays = Math.max(1, Math.round(intervalDays * 1.3));
      }
    }
    repetitions += 1;
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < MIN_EASE) {
    ease = MIN_EASE;
  }

  const nextDueAt = new Date(now);
  nextDueAt.setUTCDate(nextDueAt.getUTCDate() + intervalDays);

  return {
    ease: Number(ease.toFixed(4)),
    intervalDays,
    repetitions,
    nextDueAt,
  };
};

/**
 * Creates the initial SM-2 state when a word is first introduced.
 */
export const createInitialSm2State = (now: Date = new Date()): Sm2State => ({
  ease: 2.5,
  intervalDays: 0,
  repetitions: 0,
  nextDueAt: now,
});
