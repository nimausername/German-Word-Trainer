import { auth } from "@/auth";
import { fail } from "@/lib/api";

/**
 * Requires an authenticated session and returns the Keycloak subject.
 */
export const requireUserId = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: fail("UNAUTHORIZED", "Authentication required", { status: 401 }) };
  }
  return { userId };
};
