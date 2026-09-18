import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { words } from "../src/db/schema";

const seedWordSchema = z.object({
  lemma: z.string().min(1),
  pos: z.string().min(1),
  article: z.string().nullable(),
  singular: z.string().min(1),
  plural: z.string().nullable(),
  glossFa: z.string().min(1),
  descriptionFa: z.string(),
  rank: z.number().int().positive(),
});

const catalogSchema = z
  .array(seedWordSchema)
  .length(4000)
  .superRefine((entries, ctx) => {
    const lemmas = new Set<string>();
    const ranks = new Set<number>();
    for (const [index, entry] of entries.entries()) {
      if (/^Wort\d+$/i.test(entry.lemma)) {
        ctx.addIssue({
          code: "custom",
          message: `Placeholder lemma at index ${index}: ${entry.lemma}`,
        });
      }
      const lemmaKey = entry.lemma.toLocaleLowerCase("de-DE");
      if (lemmas.has(lemmaKey)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate lemma: ${entry.lemma}`,
        });
      }
      lemmas.add(lemmaKey);
      ranks.add(entry.rank);
    }
    if (ranks.size !== 4000) {
      ctx.addIssue({
        code: "custom",
        message: "Ranks must be unique across all 4000 words",
      });
    }
  });

/**
 * Loads the reviewed 4000-word DE→FA catalog from disk.
 */
const loadFullSeed = () => {
  const dataPath = resolve(process.cwd(), "data/words-4000.json");
  if (!existsSync(dataPath)) {
    throw new Error(
      "Missing data/words-4000.json. Run `pnpm db:build-words` first.",
    );
  }

  return catalogSchema.parse(JSON.parse(readFileSync(dataPath, "utf8")));
};

const main = async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const seed = loadFullSeed();
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await db.delete(words);

  const chunkSize = 200;
  for (let i = 0; i < seed.length; i += chunkSize) {
    await db.insert(words).values(seed.slice(i, i + chunkSize));
  }

  console.log(`Seeded ${seed.length} real German words`);
  await client.end();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
