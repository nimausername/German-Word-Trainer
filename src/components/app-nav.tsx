"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, House } from "lucide-react";
import { cn } from "cn";

const navItems = [
  { href: "/home", label: "Home", icon: House },
  { href: "/study", label: "Study", icon: BookOpen },
] as const;

type AppNavProps = {
  userNav: React.ReactNode;
};

/**
 * App chrome: brand and primary links grouped left, account on the right.
 * Mobile uses a fixed bottom bar for Home / Study.
 */
export const AppNav = ({ userNav }: AppNavProps) => {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/home"
              className="flex shrink-0 items-center gap-2"
              aria-label="German Word home"
            >
              <span className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-muted/60 text-foreground">
                <BookOpen className="size-3.5" aria-hidden />
              </span>
              <span className="truncate text-sm font-semibold tracking-tight">
                German Word
              </span>
            </Link>

            <nav
              aria-label="Primary"
              className="hidden items-center rounded-lg bg-muted/80 p-1 sm:flex"
            >
              {navItems.map(({ href, label }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-7 items-center rounded-md px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center">{userNav}</div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-1 p-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.25px]")}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
