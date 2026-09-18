import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { createKeycloakUser } from "@/lib/keycloak";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
});

export const POST = async (request: Request) => {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_JSON", "Request body must be JSON");
  }

  const parsed = signUpSchema.safeParse(json);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid sign-up payload", {
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        reason: issue.message,
      })),
    });
  }

  try {
    const userId = await createKeycloakUser(parsed.data);
    return ok({ userId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      return fail("USER_EXISTS", "An account with this email already exists", {
        status: 409,
      });
    }
    console.error(error);
    return fail("SIGN_UP_FAILED", "Unable to create account", { status: 502 });
  }
};
