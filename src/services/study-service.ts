import { and, count, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { userCards, userSettings, words } from "@/db/schema";
import { getEnv } from "@/lib/env";
import {
  applySm2Rating,
  createInitialSm2State,
  type ReviewRating,
} from "@/lib/sm2";

/**
 * Returns settings for a user, creating defaults when missing.
 */
export const getOrCreateSettings = async (userId: string) => {
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  if (existing) {
    return existing;
  }

  const env = getEnv();
  const [created] = await db
    .insert(userSettings)
    .values({
      userId,
      newWordsPerDay: env.NEW_WORDS_PER_DAY_DEFAULT,
    })
    .returning();
  return created;
};

/**
 * Counts how many new words were introduced for the user today (UTC).
 */
const countNewIntroducedToday = async (userId: string) => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const [row] = await db
    .select({ value: count() })
    .from(userCards)
    .where(
      and(eq(userCards.userId, userId), gte(userCards.createdAt, start)),
    );

  return Number(row?.value ?? 0);
};

/**
 * Picks the next study card: due reviews first, then a new word.
 */
export const getNextCard = async (userId: string) => {
  const now = new Date();
  const settings = await getOrCreateSettings(userId);

  const due = await db
    .select({
      card: userCards,
      word: words,
    })
    .from(userCards)
    .innerJoin(words, eq(userCards.wordId, words.id))
    .where(and(eq(userCards.userId, userId), lte(userCards.nextDueAt, now)))
    .orderBy(userCards.nextDueAt)
    .limit(1);

  if (due[0]) {
    return {
      kind: "review" as const,
      word: due[0].word,
      card: due[0].card,
    };
  }

  const introducedToday = await countNewIntroducedToday(userId);
  if (introducedToday >= settings.newWordsPerDay) {
    return null;
  }

  const newWord = await db
    .select({ word: words })
    .from(words)
    .leftJoin(
      userCards,
      and(eq(userCards.wordId, words.id), eq(userCards.userId, userId)),
    )
    .where(isNull(userCards.id))
    .orderBy(words.rank)
    .limit(1);

  if (!newWord[0]) {
    return null;
  }

  const initial = createInitialSm2State(now);
  const [card] = await db
    .insert(userCards)
    .values({
      userId,
      wordId: newWord[0].word.id,
      ease: initial.ease,
      intervalDays: initial.intervalDays,
      repetitions: initial.repetitions,
      nextDueAt: initial.nextDueAt,
    })
    .returning();

  return {
    kind: "new" as const,
    word: newWord[0].word,
    card,
  };
};

/**
 * Applies a review rating to a user card.
 */
export const submitReview = async (
  userId: string,
  wordId: number,
  rating: ReviewRating,
) => {
  const existing = await db.query.userCards.findFirst({
    where: and(eq(userCards.userId, userId), eq(userCards.wordId, wordId)),
  });

  if (!existing) {
    return null;
  }

  const next = applySm2Rating(
    {
      ease: existing.ease,
      intervalDays: existing.intervalDays,
      repetitions: existing.repetitions,
    },
    rating,
  );

  const [updated] = await db
    .update(userCards)
    .set({
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      nextDueAt: next.nextDueAt,
      updatedAt: new Date(),
    })
    .where(eq(userCards.id, existing.id))
    .returning();

  return updated;
};

/**
 * Aggregates learning progress for a user.
 */
export const getProgress = async (userId: string) => {
  const now = new Date();
  const settings = await getOrCreateSettings(userId);

  const [totalWordsRow] = await db.select({ value: count() }).from(words);
  const totalWords = Number(totalWordsRow?.value ?? 0);

  const [introducedRow] = await db
    .select({ value: count() })
    .from(userCards)
    .where(eq(userCards.userId, userId));
  const introduced = Number(introducedRow?.value ?? 0);

  const [dueRow] = await db
    .select({ value: count() })
    .from(userCards)
    .where(and(eq(userCards.userId, userId), lte(userCards.nextDueAt, now)));
  const due = Number(dueRow?.value ?? 0);

  const [learnedRow] = await db
    .select({ value: count() })
    .from(userCards)
    .where(
      and(
        eq(userCards.userId, userId),
        sql`${userCards.repetitions} >= 3`,
      ),
    );
  const learned = Number(learnedRow?.value ?? 0);

  const introducedToday = await countNewIntroducedToday(userId);
  const newRemainingToday = Math.max(
    0,
    settings.newWordsPerDay - introducedToday,
  );

  return {
    totalWords,
    introduced,
    remaining: Math.max(0, totalWords - introduced),
    due,
    learned,
    learning: Math.max(0, introduced - learned),
    newRemainingToday,
    newWordsPerDay: settings.newWordsPerDay,
  };
};
