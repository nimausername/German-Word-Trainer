import { z } from "zod";

/**
 * Validates process environment for the German Word Trainer.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  KEYCLOAK_ISSUER: z.string().url(),
  KEYCLOAK_CLIENT_ID: z.string().min(1),
  KEYCLOAK_CLIENT_SECRET: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url(),
  AUTH_TRUST_HOST: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  NEW_WORDS_PER_DAY_DEFAULT: z.coerce.number().int().positive().default(20),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Returns validated environment variables.
 */
export const getEnv = (): Env => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
};
