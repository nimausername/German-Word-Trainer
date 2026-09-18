"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { SessionComplete } from "@/components/session-complete";
import { StudyFlipCard } from "@/components/study-flip-card";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type StudyWord = {
  id: number;
  lemma: string;
  pos: string;
  article: string | null;
  singular: string;
  plural: string | null;
  glossFa: string;
  descriptionFa: string;
  rank: number;
};

type StudyCard = {
  kind: "new" | "review";
  word: StudyWord;
};

type Rating = "again" | "hard" | "good" | "easy";

const RATING_KEYS: Record<string, Rating> = {
  "1": "again",
  "2": "hard",
  "3": "good",
  "4": "easy",
};

/**
 * Returns true when the event target is an editable field.
 */
const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
};

/**
 * Returns true when Space/Enter should yield to a focused control.
 */
const isInteractiveTarget = (target: EventTarget | null) => {
  if (isEditableTarget(target)) {
    return true;
  }
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest("button, a, [role='button']"));
};

/**
 * Interactive study session: flip card to reveal, then rate.
 */
export const StudySession = () => {
  const [card, setCard] = useState<StudyCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRevealed(false);
    try {
      const response = await fetch("/api/v1/session/next");
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "Unable to load card");
        setCard(null);
        return;
      }
      setCard(body.data.card);
    } catch {
      setError("Unable to load card");
      setCard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      await loadNext();
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [loadNext]);

  const handleFlip = useCallback(() => {
    if (submitting) {
      return;
    }
    setRevealed((prev) => !prev);
  }, [submitting]);

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!card || submitting) {
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/v1/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wordId: card.word.id, rating }),
        });
        const body = await response.json();
        if (!response.ok) {
          setError(body?.error?.message ?? "Unable to save review");
          return;
        }
        await loadNext();
      } catch {
        setError("Unable to save review");
      } finally {
        setSubmitting(false);
      }
    },
    [card, loadNext, submitting],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const rating = RATING_KEYS[event.key];
      if (rating) {
        if (isEditableTarget(event.target)) {
          return;
        }
        if (!card || !revealed || submitting) {
          return;
        }
        event.preventDefault();
        void handleRate(rating);
        return;
      }

      if (event.key !== " " && event.key !== "Enter") {
        return;
      }
      if (isInteractiveTarget(event.target)) {
        return;
      }
      if (!card || submitting) {
        return;
      }
      event.preventDefault();
      handleFlip();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [card, handleFlip, handleRate, revealed, submitting]);

  if (loading && !card) {
    return (
      <PageShell
        size="narrow"
        withNav
        className="items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </PageShell>
    );
  }

  if (!card) {
    return <SessionComplete error={error} />;
  }

  const word = card.word;

  return (
    <PageShell
      size="narrow"
      withNav
      className="justify-center gap-3 py-4 sm:gap-4 sm:py-5 md:gap-4 md:py-6"
    >
      <div className="flex w-full flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant={card.kind === "new" ? "info-light" : "secondary"}
            size="sm"
            radius="full"
            className="capitalize"
          >
            {card.kind}
          </Badge>
        </div>

        <StudyFlipCard
          key={word.id}
          word={word}
          revealed={revealed}
          onFlip={handleFlip}
          disabled={submitting}
        />

        <div className="flex min-h-16 flex-col justify-center gap-2">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {revealed ? (
            <>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-10 text-xs sm:min-h-9 sm:text-sm"
                  disabled={submitting}
                  onClick={() => void handleRate("again")}
                >
                  Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-10 text-xs sm:min-h-9 sm:text-sm"
                  disabled={submitting}
                  onClick={() => void handleRate("hard")}
                >
                  Hard
                </Button>
                <Button
                  size="sm"
                  className="min-h-10 text-xs sm:min-h-9 sm:text-sm"
                  disabled={submitting}
                  onClick={() => void handleRate("good")}
                >
                  Good
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-10 text-xs sm:min-h-9 sm:text-sm"
                  disabled={submitting}
                  onClick={() => void handleRate("easy")}
                >
                  Easy
                </Button>
              </div>
              <p className="hidden text-center text-xs text-muted-foreground sm:block">
                1–4 to rate
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Recall the meaning, then flip.
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
};
