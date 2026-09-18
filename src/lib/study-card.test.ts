import { describe, expect, it } from "vitest";
import {
  cleanLearnerNote,
  formatGermanFront,
  shouldShowLemma,
  splitGlosses,
  splitMixedScript,
} from "@/lib/study-card";

describe("splitMixedScript", () => {
  it("isolates German inside a Persian note and drops a trailing Latin period", () => {
    expect(splitMixedScript("شکل مؤنث ein.")).toEqual([
      { lang: "fa", value: "شکل مؤنث" },
      { lang: "de", value: "ein" },
    ]);
  });

  it("keeps a fully Persian note intact", () => {
    expect(splitMixedScript("برای خطاب مؤدبانه هم به کار می‌رود.")).toEqual([
      { lang: "fa", value: "برای خطاب مؤدبانه هم به کار می‌رود" },
    ]);
  });
});

describe("cleanLearnerNote", () => {
  it("hides notes that only restate gender and plural", () => {
    expect(cleanLearnerNote("اسم خنثی. جمع: Häuser.", "Häuser")).toBe("");
  });

  it("keeps a useful usage note", () => {
    expect(
      cleanLearnerNote("برای خطاب مؤدبانه هم به کار می‌رود.", null),
    ).toBe("برای خطاب مؤدبانه هم به کار می‌رود");
  });
});

describe("formatGermanFront", () => {
  it("pairs article and singular for nouns", () => {
    expect(
      formatGermanFront({
        lemma: "Haus",
        pos: "noun",
        article: "das",
        singular: "Haus",
        plural: "Häuser",
        glossFa: "خانه",
        descriptionFa: "",
      }),
    ).toEqual({ article: "das", headword: "Haus" });
  });
});

describe("splitGlosses", () => {
  it("promotes the first sense and keeps the rest as extras", () => {
    expect(splitGlosses("کودک؛ بچه")).toEqual({
      primary: "کودک",
      extras: ["بچه"],
    });
  });
});

describe("shouldShowLemma", () => {
  it("hides the lemma when it matches the shown form", () => {
    expect(
      shouldShowLemma(
        {
          lemma: "eine",
          pos: "article",
          article: null,
          singular: "eine",
          plural: null,
          glossFa: "یک (مؤنث)",
          descriptionFa: "شکل مؤنث ein.",
        },
        "eine",
      ),
    ).toBe(false);
  });
});
