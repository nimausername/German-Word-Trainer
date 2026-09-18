import { ok } from "@/lib/api";
import { getEnv } from "@/lib/env";

export const GET = () => {
  getEnv();
  return ok({ ok: true });
};
