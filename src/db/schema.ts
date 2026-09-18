import {
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Global German vocabulary entries with Persian learner content.
 */
export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  lemma: varchar("lemma", { length: 128 }).notNull(),
  pos: varchar("pos", { length: 32 }).notNull(),
  article: varchar("article", { length: 8 }),
  singular: varchar("singular", { length: 128 }).notNull(),
  plural: varchar("plural", { length: 128 }),
  glossFa: text("gloss_fa").notNull(),
  descriptionFa: text("description_fa").notNull().default(""),
  rank: integer("rank").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Per-user SM-2 card state keyed by Keycloak subject.
 */
export const userCards = pgTable(
  "user_cards",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    ease: real("ease").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    nextDueAt: timestamp("next_due_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("user_cards_user_word_uidx").on(table.userId, table.wordId)],
);

/**
 * Per-user study preferences.
 */
export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id", { length: 128 }).primaryKey(),
  newWordsPerDay: integer("new_words_per_day").notNull().default(20),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Word = typeof words.$inferSelect;
export type UserCard = typeof userCards.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
