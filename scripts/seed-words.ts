import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { words } from "../src/db/schema";
import { sampleWords } from "./sample-words-data";

const main = async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await db.delete(words);
  await db.insert(words).values([...sampleWords]);

  console.log(`Seeded ${sampleWords.length} sample words`);
  await client.end();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
