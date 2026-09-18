import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { submitReview } from "@/services/study-service";

const reviewSchema = z.object({
  wordId: z.coerce.number().int().positive(),
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export const POST = async (request: Request) => {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_JSON", "Request body must be JSON");
  }

  const parsed = reviewSchema.safeParse(json);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid review payload", {
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        reason: issue.message,
      })),
    });
  }

  try {
    const updated = await submitReview(
      authResult.userId,
      parsed.data.wordId,
      parsed.data.rating,
    );
    if (!updated) {
      return fail("CARD_NOT_FOUND", "Card not found for this user", {
        status: 404,
      });
    }
    return ok({
      card: {
        wordId: updated.wordId,
        ease: updated.ease,
        intervalDays: updated.intervalDays,
        repetitions: updated.repetitions,
        nextDueAt: updated.nextDueAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    return fail("REVIEW_FAILED", "Unable to save review", { status: 500 });
  }
};
