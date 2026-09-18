"use client";

import { useSyncExternalStore } from "react";
import { BorderBeam } from "border-beam";
import { useTheme } from "next-themes";
import { cn } from "cn";
import { MixedScriptText } from "@/components/mixed-script-text";
import { Badge } from "@/components/reui/badge";
import {
  articleToneClass,
  cleanLearnerNote,
  formatGenderFa,
  formatGermanFront,
  formatPosLabel,
  shouldShowLemma,
  splitGlosses,
  type StudyCardWord,
} from "@/lib/study-card";

/** `rounded-xl` = `--radius * 1.4` = `0.625rem * 1.4` = 14px. */
const CARD_BEAM_RADIUS_PX = 14;

export type StudyFlipWord = StudyCardWord & {
  rank: number;
};

type StudyFlipCardProps = {
  word: StudyFlipWord;
  revealed: boolean;
  onFlip: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Subscribes to the user's reduced-motion preference.
 */
const subscribeReducedMotion = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
};

/**
 * Reads whether reduced motion is currently preferred.
 */
const getReducedMotionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * SSR snapshot: assume motion is allowed until the client hydrates.
 */
const getReducedMotionServerSnapshot = () => false;

/**
 * Flippable study card: German prompt on the front, Persian meaning on the back.
 * Uses CSS 3D transforms; respects prefers-reduced-motion.
 */
export const StudyFlipCard = ({
  word,
  revealed,
  onFlip,
  disabled = false,
  className,
}: StudyFlipCardProps) => {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const beamTheme = resolvedTheme === "light" ? "light" : "dark";
  const front = formatGermanFront(word);
  const glosses = splitGlosses(word.glossFa);
  const genderFa = formatGenderFa(word.article);
  const noteFa = cleanLearnerNote(word.descriptionFa, word.plural);
  const showLemma = shouldShowLemma(word, front.article ? `${front.article} ${front.headword}` : front.headword);

  const handleClick = () => {
    if (disabled) {
      return;
    }
    onFlip();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onFlip();
    }
  };

  return (
    <div
      className={cn(
        "relative animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300 motion-reduce:animate-none",
        "has-[:focus-visible]:rounded-xl has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        className,
      )}
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={revealed}
        aria-disabled={disabled || undefined}
        aria-label={
          revealed
            ? `Hide meaning of ${front.headword}`
            : `Show meaning of ${front.headword}`
        }
        className={cn(
          "group relative w-full cursor-pointer outline-none [perspective:1200px]",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div
          className={cn(
            "relative min-h-56 w-full transition-transform duration-300 ease-out [transform-style:preserve-3d] motion-reduce:transition-none sm:min-h-64",
            revealed && "[transform:rotateY(180deg)]",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 flex flex-col rounded-xl border border-border bg-card p-4 shadow-xs [backface-visibility:hidden] sm:p-5",
              "dark:bg-clip-border",
            )}
            aria-hidden={revealed}
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {formatPosLabel(word.pos)}
            </p>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2 text-center">
              <p
                className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                lang="de"
                dir="ltr"
              >
                {front.article ? (
                  <>
                    <span className={cn(articleToneClass(front.article))}>
                      {front.article}
                    </span>{" "}
                    {front.headword}
                  </>
                ) : (
                  front.headword
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                What does this mean?
              </p>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Tap to flip
              <span className="hidden sm:inline"> · Space</span>
            </p>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col rounded-xl border border-border bg-card p-4 shadow-xs [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-5",
              "dark:bg-clip-border",
            )}
            aria-hidden={!revealed}
          >
            <p
              className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
              dir="ltr"
            >
              Meaning
            </p>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-1">
              <div
                className="w-full space-y-1.5 text-center font-[family-name:var(--font-fa)]"
                dir="rtl"
                lang="fa"
              >
                <p className="text-pretty text-2xl font-semibold leading-snug sm:text-3xl">
                  {glosses.primary}
                </p>
                {glosses.extras.length > 0 ? (
                  <p className="text-pretty text-sm text-muted-foreground sm:text-base">
                    {glosses.extras.join(" · ")}
                  </p>
                ) : null}
              </div>

              <ul
                className="flex flex-wrap items-center justify-center gap-1.5"
                dir="ltr"
              >
                {word.article ? (
                  <li>
                    <Badge
                      variant="secondary"
                      size="lg"
                      radius="full"
                      className="gap-1 font-medium"
                    >
                      <span
                        className={cn("font-semibold", articleToneClass(word.article))}
                        dir="ltr"
                        lang="de"
                      >
                        {word.article}
                      </span>
                      {genderFa ? (
                        <bdi
                          dir="rtl"
                          lang="fa"
                          className="font-[family-name:var(--font-fa)]"
                        >
                          {genderFa}
                        </bdi>
                      ) : null}
                    </Badge>
                  </li>
                ) : null}
                {word.plural ? (
                  <li>
                    <Badge variant="outline" size="lg" radius="full" lang="de">
                      Plural {word.plural}
                    </Badge>
                  </li>
                ) : null}
                {showLemma ? (
                  <li>
                    <Badge variant="outline" size="lg" radius="full" lang="de">
                      Form {word.lemma}
                    </Badge>
                  </li>
                ) : null}
              </ul>

              {noteFa ? (
                <p className="max-w-prose text-center text-sm leading-relaxed text-muted-foreground">
                  <MixedScriptText text={noteFa} />
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm" dir="ltr">
              Tap to flip back
            </p>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden="true"
      >
        <BorderBeam
          active={revealed && !prefersReducedMotion}
          size="md"
          colorVariant="colorful"
          theme={beamTheme}
          borderRadius={CARD_BEAM_RADIUS_PX}
          className="h-full w-full"
        >
          <div className="h-full w-full rounded-xl" />
        </BorderBeam>
      </div>
    </div>
  );
};
