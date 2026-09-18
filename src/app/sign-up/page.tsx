import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignUpPage() {
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
            Create an account and start learning.
          </p>
        </div>
        <AuthForm mode="sign-up" />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="underline underline-offset-4" href="/sign-in">
            Sign in
          </Link>
        </p>
      </PageShell>
    </div>
  );
}
