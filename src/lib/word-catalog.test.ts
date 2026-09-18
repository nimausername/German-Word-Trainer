import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type CatalogWord = {
  lemma: string;
  pos: string;
  article: string | null;
  singular: string;
  plural: string | null;
  glossFa: string;
  descriptionFa: string;
  rank: number;
};

const PERSIAN_RE = /[\u0600-\u06FF]/;
const PLACEHOLDER_RE = /^Wort\d+$/i;

describe("4000-word catalog", () => {
  const catalog = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/words-4000.json"), "utf8"),
  ) as CatalogWord[];

  it("contains 4000 unique real German lemmas with Persian glosses", () => {
    expect(catalog).toHaveLength(4000);

    const lemmas = new Set(catalog.map((word) => word.lemma.toLocaleLowerCase("de-DE")));
    const ranks = new Set(catalog.map((word) => word.rank));

    expect(lemmas.size).toBe(4000);
    expect(ranks.size).toBe(4000);
    expect(catalog.every((word) => PERSIAN_RE.test(word.glossFa))).toBe(true);
    expect(catalog.some((word) => PLACEHOLDER_RE.test(word.lemma))).toBe(false);
    expect(
      catalog.some((word) => word.descriptionFa.includes("جای‌نگهدار")),
    ).toBe(false);
  });

  it("starts with high-frequency function words instead of placeholders", () => {
    expect(catalog[0]?.lemma).toBe("ich");
    expect(catalog[0]?.glossFa).toBe("من");
    expect(catalog.find((word) => word.lemma === "Haus")?.glossFa).toBe("خانه");
    expect(catalog.find((word) => word.lemma === "machen")?.glossFa).toContain(
      "کردن",
    );
  });
});
