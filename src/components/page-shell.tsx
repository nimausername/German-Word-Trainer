import { cn } from "cn";

type PageShellProps = {
  children: React.ReactNode;
  /** Content width: study cards (narrow), dashboards (default), or wider layouts. */
  size?: "narrow" | "default" | "wide";
  /** Extra bottom padding so fixed mobile nav does not cover content. */
  withNav?: boolean;
  className?: string;
};

const sizeClassName = {
  narrow: "max-w-lg",
  default: "max-w-2xl",
  wide: "max-w-4xl",
} as const;

/**
 * Responsive page container with safe-area padding for phones, tablets, and desktop.
 */
export const PageShell = ({
  children,
  size = "default",
  withNav = false,
  className,
}: PageShellProps) => {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-1 flex-col",
        sizeClassName[size],
        "gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 md:gap-8 md:px-8 md:py-8",
        "pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 md:pb-8",
        withNav &&
          "pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-6 md:pb-8",
        className,
      )}
    >
      {children}
    </main>
  );
};
