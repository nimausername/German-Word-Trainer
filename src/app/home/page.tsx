import Link from "next/link";
import { BookOpenIcon } from "lucide-react";
import { AppChrome } from "@/components/app-chrome";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { auth } from "@/auth";
import { getProgress } from "@/services/study-service";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const progress = await getProgress(session.user.id);

  return (
    <AppChrome>
      <PageShell withNav>
        <PageHeader
          title="Home"
          description="Reviews first, then new words for today."
        />

        <Frame className="w-full" stacked>
          <FrameHeader>
            <FrameTitle>Today</FrameTitle>
            <FrameDescription>
              Reviews first, then new words for today.
            </FrameDescription>
          </FrameHeader>

          <FramePanel>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-3xl font-medium tracking-tight tabular-nums">
                  {progress.due}
                </p>
                <p className="text-sm text-muted-foreground">Due today</p>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-3xl font-medium tracking-tight tabular-nums">
                  {progress.newRemainingToday}
                </p>
                <p className="text-sm text-muted-foreground">New remaining</p>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-3xl font-medium tracking-tight tabular-nums">
                  {progress.learned}
                </p>
                <p className="text-sm text-muted-foreground">Learned</p>
              </div>
            </div>
          </FramePanel>

          <FramePanel className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Ready to study?</p>
              <p className="text-pretty text-sm text-muted-foreground">
                Reviews come first, then up to {progress.newWordsPerDay} new
                words per day.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/study"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-11 w-full justify-center sm:w-auto",
                )}
              >
                <BookOpenIcon data-icon="inline-start" aria-hidden />
                Start study
              </Link>
              <Link
                href="/profile"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-11 w-full justify-center sm:w-auto",
                )}
              >
                View profile
              </Link>
            </div>
          </FramePanel>
        </Frame>
      </PageShell>
    </AppChrome>
  );
}
