import { requireUserId } from "@/lib/session";
import { fail, ok } from "@/lib/api";
import { getNextCard } from "@/services/study-service";

export const GET = async () => {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const next = await getNextCard(authResult.userId);
    if (!next) {
      return ok({ card: null });
    }

    return ok({
      card: {
        kind: next.kind,
        word: {
          id: next.word.id,
          lemma: next.word.lemma,
          pos: next.word.pos,
          article: next.word.article,
          singular: next.word.singular,
          plural: next.word.plural,
          glossFa: next.word.glossFa,
          descriptionFa: next.word.descriptionFa,
          rank: next.word.rank,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return fail("SESSION_NEXT_FAILED", "Unable to load next card", {
      status: 500,
    });
  }
};
