"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BookOpenIcon,
  ChartColumnIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import {
  updateDisplayNameAction,
  updateNewWordsPerDayAction,
} from "@/app/actions/settings";
import { signOutAction } from "@/app/actions/auth";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/reui/number-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "cn";

export type ProfileProgress = {
  totalWords: number;
  introduced: number;
  remaining: number;
  due: number;
  learned: number;
  learning: number;
  newRemainingToday: number;
  newWordsPerDay: number;
};

type ProfilePageProps = {
  email?: string | null;
  name?: string | null;
  progress: ProfileProgress;
};

/**
 * Builds display name and avatar initial from the signed-in user.
 */
const getUserDisplay = (email?: string | null, name?: string | null) => {
  const label = name?.trim() || email?.trim() || "Account";
  const detail = email?.trim() || null;
  const initialSource = name?.trim() || email?.trim() || "A";
  const initial = initialSource.charAt(0).toUpperCase();
  return { label, detail, initial };
};

/**
 * Returns a short line explaining what to do today.
 */
const getTodayFocus = (due: number, newRemainingToday: number) => {
  if (due > 0 && newRemainingToday > 0) {
    return "Reviews first, then new words.";
  }
  if (due > 0) {
    return "Clear your reviews, then you're done for today.";
  }
  if (newRemainingToday > 0) {
    return "No reviews waiting — you can learn new words.";
  }
  return "You're caught up for today.";
};

/**
 * Share of the full list for a vocabulary stage.
 */
const getSharePercent = (count: number, total: number) => {
  if (total <= 0 || count <= 0) {
    return 0;
  }
  return Math.max((count / total) * 100, 0.5);
};

/**
 * Full user profile: identity, clear progress, and account settings.
 * Composition adapted from @reui/c-avatar-16, c-tabs-6, c-frame-3,
 * c-progress-4, and c-number-field-5.
 */
export const ProfilePage = ({ email, name, progress }: ProfilePageProps) => {
  const router = useRouter();
  const detail = email?.trim() || null;
  const [displayName, setDisplayName] = useState(
    name?.trim() || email?.trim() || "",
  );
  const [savedDisplayName, setSavedDisplayName] = useState(
    name?.trim() || email?.trim() || "",
  );
  const { label, initial } = getUserDisplay(email, savedDisplayName);
  const percent =
    progress.totalWords === 0
      ? 0
      : Math.round((progress.introduced / progress.totalWords) * 100);
  const learnedShare = getSharePercent(progress.learned, progress.totalWords);
  const learningShare = getSharePercent(progress.learning, progress.totalWords);
  const studyHref =
    progress.due > 0 || progress.newRemainingToday > 0 ? "/study" : "/home";
  const studyLabel =
    progress.due > 0
      ? "Review due words"
      : progress.newRemainingToday > 0
        ? "Learn new words"
        : "Back to home";

  const [newWordsPerDay, setNewWordsPerDay] = useState(progress.newWordsPerDay);
  const [savedWordsPerDay, setSavedWordsPerDay] = useState(
    progress.newWordsPerDay,
  );
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isSavingName, startNameTransition] = useTransition();
  const [isSavingWords, startWordsTransition] = useTransition();

  const isWordsDirty = newWordsPerDay !== savedWordsPerDay;
  const isNameDirty = displayName.trim() !== savedDisplayName.trim();

  const handleWordsChange = (value: number | null) => {
    if (value === null) {
      return;
    }
    setNewWordsPerDay(value);
    setSettingsError(null);
    setSettingsMessage(null);
  };

  const handleDisplayNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDisplayName(event.target.value);
    setProfileError(null);
    setProfileMessage(null);
  };

  const handleSaveDisplayName = () => {
    startNameTransition(async () => {
      setProfileError(null);
      setProfileMessage(null);
      const result = await updateDisplayNameAction(displayName);
      if (!result.ok) {
        setProfileError(result.error);
        return;
      }
      setSavedDisplayName(result.name);
      setDisplayName(result.name);
      setProfileMessage("Display name saved.");
      router.refresh();
    });
  };

  const handleSaveSettings = () => {
    startWordsTransition(async () => {
      setSettingsError(null);
      setSettingsMessage(null);
      const result = await updateNewWordsPerDayAction(newWordsPerDay);
      if (!result.ok) {
        setSettingsError(result.error);
        return;
      }
      setSavedWordsPerDay(result.newWordsPerDay);
      setNewWordsPerDay(result.newWordsPerDay);
      setSettingsMessage("Daily limit saved.");
    });
  };

  const handleSignOut = () => {
    void signOutAction();
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="size-12">
          <AvatarFallback className="text-base font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {label}
            </span>
            <Badge variant="primary-light" size="xs" radius="full">
              Learner
            </Badge>
          </div>
          {detail ? (
            <span className="truncate text-sm text-muted-foreground">
              {detail}
            </span>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="progress" className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="progress" className="flex-1 gap-1.5">
            <ChartColumnIcon className="size-4" aria-hidden />
            Progress
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 gap-1.5">
            <SettingsIcon className="size-4" aria-hidden />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="outline-none">
          <Frame className="w-full" stacked>
            <FrameHeader>
              <FrameTitle>Progress</FrameTitle>
              <FrameDescription>
                {getTodayFocus(progress.due, progress.newRemainingToday)}
              </FrameDescription>
            </FrameHeader>

            <FramePanel className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Today
                </p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-3xl font-medium tracking-tight tabular-nums">
                      {progress.due}
                    </p>
                    <p className="text-sm text-muted-foreground">to review</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-medium tracking-tight tabular-nums">
                      {progress.newRemainingToday}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      new left
                      <span className="text-muted-foreground/80">
                        {" "}
                        / {progress.newWordsPerDay}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Progress value={percent} className="w-full">
                  <ProgressLabel>Word list</ProgressLabel>
                  <ProgressValue />
                </Progress>
                <p className="text-sm text-muted-foreground">
                  <span className="tabular-nums text-foreground">
                    {progress.introduced.toLocaleString()}
                  </span>
                  {" of "}
                  <span className="tabular-nums">
                    {progress.totalWords.toLocaleString()}
                  </span>
                  {" words started"}
                </p>
              </div>

              <div className="space-y-2.5">
                <div
                  className="flex h-2 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`Learned ${progress.learned}, learning ${progress.learning}, not started ${progress.remaining}`}
                >
                  <span
                    className="bg-success transition-all"
                    style={{ width: `${learnedShare}%` }}
                  />
                  <span
                    className="bg-info transition-all"
                    style={{ width: `${learningShare}%` }}
                  />
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  <li className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full bg-success"
                      aria-hidden
                    />
                    <span className="text-muted-foreground">Learned</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {progress.learned.toLocaleString()}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-info" aria-hidden />
                    <span className="text-muted-foreground">Learning</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {progress.learning.toLocaleString()}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full bg-muted-foreground/40"
                      aria-hidden
                    />
                    <span className="text-muted-foreground">Not started</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {progress.remaining.toLocaleString()}
                    </span>
                  </li>
                </ul>
              </div>
            </FramePanel>

            <FramePanel>
              <Link
                href={studyHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-11 w-full justify-center sm:w-auto",
                )}
              >
                <BookOpenIcon data-icon="inline-start" aria-hidden />
                {studyLabel}
              </Link>
            </FramePanel>
          </Frame>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 outline-none">
          <Frame className="w-full" stacked>
            <FrameHeader>
              <FrameTitle>Account</FrameTitle>
              <FrameDescription>
                Identity from your sign-in and study preferences.
              </FrameDescription>
            </FrameHeader>

            <FramePanel className="space-y-4">
              <Field className="max-w-sm gap-2">
                <FieldLabel htmlFor="display-name">Display name</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="display-name"
                    name="displayName"
                    autoComplete="name"
                    value={displayName}
                    onChange={handleDisplayNameChange}
                    placeholder="Your name"
                    maxLength={120}
                    disabled={isSavingName}
                    className="h-9 min-w-0 flex-1"
                    aria-label="Display name"
                  />
                  <Button
                    type="button"
                    size="lg"
                    className="shrink-0 px-4"
                    disabled={
                      !isNameDirty || isSavingName || !displayName.trim()
                    }
                    onClick={handleSaveDisplayName}
                    aria-label={
                      isSavingName ? "Saving display name" : "Save display name"
                    }
                  >
                    {isSavingName ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        Saving
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
                {profileError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {profileError}
                  </p>
                ) : null}
                {profileMessage ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    {profileMessage}
                  </p>
                ) : null}
              </Field>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detail ?? "Not available"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Email can’t be changed here yet.
                </p>
              </div>
            </FramePanel>

            <FramePanel>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Daily new words
                </p>
                <p className="text-sm text-muted-foreground text-pretty">
                  How many new words to introduce after reviews each day.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <NumberField
                    value={newWordsPerDay}
                    onValueChange={handleWordsChange}
                    min={1}
                    max={100}
                    size="lg"
                    className="w-auto gap-0"
                  >
                    <NumberFieldScrubArea
                      label="New words per day"
                      className="sr-only"
                    />
                    <NumberFieldGroup className="w-28">
                      <NumberFieldDecrement aria-label="Decrease daily limit" />
                      <NumberFieldInput />
                      <NumberFieldIncrement aria-label="Increase daily limit" />
                    </NumberFieldGroup>
                  </NumberField>
                  <Button
                    type="button"
                    size="lg"
                    className="shrink-0 px-4"
                    disabled={!isWordsDirty || isSavingWords}
                    onClick={handleSaveSettings}
                    aria-label="Save daily new-word limit"
                  >
                    {isSavingWords ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>

              {settingsError ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {settingsError}
                </p>
              ) : null}
              {settingsMessage ? (
                <p className="mt-2 text-sm text-muted-foreground" role="status">
                  {settingsMessage}
                </p>
              ) : null}
            </FramePanel>

            <FramePanel>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-h-11 w-full text-destructive hover:text-destructive sm:w-auto"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOutIcon data-icon="inline-start" aria-hidden />
                Sign out
              </Button>
            </FramePanel>
          </Frame>
        </TabsContent>
      </Tabs>
    </div>
  );
};
