import Link from "next/link";
import { CircleCheck, House, UserRound } from "lucide-react";
import { IconStack } from "@/components/reui/icon-stack";
import { PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "cn";

type SessionCompleteProps = {
  error?: string | null;
};

/**
 * Study catch-up empty state — ReUI IconStack + Empty composition.
 * Pattern adapted from `@reui/c-icon-stack-5`.
 */
export const SessionComplete = ({ error }: SessionCompleteProps) => {
  return (
    <PageShell
      size="narrow"
      withNav
      className="items-center justify-center"
    >
      <Empty className="max-w-md border-0 py-8 sm:py-12">
        <EmptyHeader>
          <EmptyMedia>
            <IconStack aria-hidden="true" className="h-24 w-22 text-primary">
              <CircleCheck className="size-5 text-primary" />
            </IconStack>
          </EmptyMedia>
          <EmptyTitle className="text-base sm:text-lg">
            Session complete
          </EmptyTitle>
          <EmptyDescription>
            No more cards due right now. Come back later for reviews or raise
            your daily new-word limit.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/home"
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-h-11 w-full justify-center sm:w-auto",
            )}
          >
            <House data-icon="inline-start" aria-hidden />
            Back home
          </Link>
          <Link
            href="/profile"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 w-full justify-center sm:w-auto",
            )}
          >
            <UserRound data-icon="inline-start" aria-hidden />
            Profile
          </Link>
        </EmptyContent>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </Empty>
    </PageShell>
  );
};
