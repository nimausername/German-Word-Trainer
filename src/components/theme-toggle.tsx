"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
  className?: string;
};

/**
 * Animated light/dark theme toggle (adapted from @reui/c-button-61).
 */
export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("relative shrink-0", className)}
      onClick={handleToggle}
      disabled={!mounted}
      aria-label={
        mounted
          ? `Switch to ${isDark ? "light" : "dark"} mode`
          : "Toggle theme"
      }
      aria-pressed={mounted ? isDark : undefined}
    >
      <SunIcon
        className={cn(
          "size-4 transition-all duration-300",
          isDark
            ? "scale-0 -rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100",
        )}
        aria-hidden
      />
      <MoonIcon
        className={cn(
          "absolute size-4 transition-all duration-300",
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 rotate-90 opacity-0",
        )}
        aria-hidden
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
