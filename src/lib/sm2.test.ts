import { describe, expect, it } from "vitest";
import { applySm2Rating, createInitialSm2State } from "@/lib/sm2";

describe("applySm2Rating", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("resets progress on again", () => {
    const next = applySm2Rating(
      { ease: 2.5, intervalDays: 10, repetitions: 4 },
      "again",
      now,
    );
    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(1);
    expect(next.nextDueAt.toISOString()).toBe("2026-01-02T12:00:00.000Z");
  });

  it("schedules first good review for one day", () => {
    const initial = createInitialSm2State(now);
    const next = applySm2Rating(initial, "good", now);
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
  });

  it("increases interval on subsequent good reviews", () => {
    const first = applySm2Rating(
      { ease: 2.5, intervalDays: 0, repetitions: 0 },
      "good",
      now,
    );
    const second = applySm2Rating(first, "good", now);
    expect(second.intervalDays).toBe(3);
    const third = applySm2Rating(second, "good", now);
    expect(third.intervalDays).toBeGreaterThan(3);
  });

  it("keeps ease above the minimum", () => {
    let state = { ease: 1.4, intervalDays: 1, repetitions: 2 };
    for (let i = 0; i < 20; i += 1) {
      state = applySm2Rating(state, "again", now);
    }
    expect(state.ease).toBeGreaterThanOrEqual(1.3);
  });
});
