"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth, unstable_update } from "@/auth";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { updateKeycloakDisplayName } from "@/lib/keycloak";
import { getOrCreateSettings } from "@/services/study-service";

const updateWordsSchema = z.object({
  newWordsPerDay: z.number().int().min(1).max(100),
});

const updateNameSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

type UpdateSettingsResult =
  | { ok: true; newWordsPerDay: number }
  | { ok: false; error: string };

type UpdateDisplayNameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

/**
 * Updates the signed-in user's daily new-word limit.
 */
export const updateNewWordsPerDayAction = async (
  newWordsPerDay: number,
): Promise<UpdateSettingsResult> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = updateWordsSchema.safeParse({ newWordsPerDay });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Choose a daily limit between 1 and 100.",
    };
  }

  try {
    await getOrCreateSettings(session.user.id);
    const [updated] = await db
      .update(userSettings)
      .set({
        newWordsPerDay: parsed.data.newWordsPerDay,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, session.user.id))
      .returning();

    return { ok: true, newWordsPerDay: updated.newWordsPerDay };
  } catch (error) {
    console.error("[settings] update failed", error);
    return { ok: false, error: "Unable to save settings." };
  }
};

/**
 * Updates the signed-in user's display name in Keycloak and the session.
 */
export const updateDisplayNameAction = async (
  name: string,
): Promise<UpdateDisplayNameResult> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = updateNameSchema.safeParse({ name });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Enter a display name between 1 and 120 characters.",
    };
  }

  try {
    await updateKeycloakDisplayName(session.user.id, parsed.data.name);
    await unstable_update({
      user: { name: parsed.data.name },
    });
    return { ok: true, name: parsed.data.name };
  } catch (error) {
    console.error("[profile] display name update failed", error);
    return { ok: false, error: "Unable to save display name." };
  }
};
