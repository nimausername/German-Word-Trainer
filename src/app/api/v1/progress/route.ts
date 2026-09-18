import { fail, ok } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { getProgress } from "@/services/study-service";

export const GET = async () => {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const progress = await getProgress(authResult.userId);
    return ok(progress);
  } catch (error) {
    console.error(error);
    return fail("PROGRESS_FAILED", "Unable to load progress", { status: 500 });
  }
};
