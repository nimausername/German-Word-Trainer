import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { getOrCreateSettings } from "@/services/study-service";

const patchSchema = z.object({
  newWordsPerDay: z.number().int().min(1).max(100),
});

export const GET = async () => {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const settings = await getOrCreateSettings(authResult.userId);
    return ok({
      newWordsPerDay: settings.newWordsPerDay,
    });
  } catch (error) {
    console.error(error);
    return fail("SETTINGS_FAILED", "Unable to load settings", { status: 500 });
  }
};

export const PATCH = async (request: Request) => {
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

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid settings payload", {
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        reason: issue.message,
      })),
    });
  }

  try {
    await getOrCreateSettings(authResult.userId);
    const [updated] = await db
      .update(userSettings)
      .set({
        newWordsPerDay: parsed.data.newWordsPerDay,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, authResult.userId))
      .returning();

    return ok({ newWordsPerDay: updated.newWordsPerDay });
  } catch (error) {
    console.error(error);
    return fail("SETTINGS_UPDATE_FAILED", "Unable to update settings", {
      status: 500,
    });
  }
};
