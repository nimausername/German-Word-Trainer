import { NextResponse } from "next/server";

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; reason: string }>;
  };
  meta: { requestId: string };
};

/**
 * Builds a stable success JSON response.
 */
export const ok = <T>(
  data: T,
  init?: { status?: number; meta?: Record<string, unknown> },
) => {
  const requestId = crypto.randomUUID();
  return NextResponse.json(
    { data, meta: { requestId, ...(init?.meta ?? {}) } },
    { status: init?.status ?? 200 },
  );
};

/**
 * Builds a stable error JSON response.
 */
export const fail = (
  code: string,
  message: string,
  init?: {
    status?: number;
    details?: Array<{ field?: string; reason: string }>;
  },
) => {
  const body: ErrorBody = {
    error: {
      code,
      message,
      details: init?.details,
    },
    meta: { requestId: crypto.randomUUID() },
  };
  return NextResponse.json(body, { status: init?.status ?? 400 });
};
