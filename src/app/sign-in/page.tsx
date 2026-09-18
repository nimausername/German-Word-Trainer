import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <PageShell
        size="narrow"
        className="min-h-dvh items-center justify-center py-8 sm:py-12"
      >
        <div className="mb-2 text-center sm:mb-4">
          <p className="text-lg font-semibold tracking-tight sm:text-xl">
            German Word Trainer
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Spaced repetition for high-frequency German.
          </p>
        </div>
        <AuthForm mode="sign-in" />
        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link className="underline underline-offset-4" href="/sign-up">
            Sign up
          </Link>
        </p>
      </PageShell>
    </div>
  );
}
