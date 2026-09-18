import { cn } from "cn";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Stacks title and actions on narrow screens; aligns in a row from tablet up.
 */
export const PageHeader = ({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
          {title}
        </h1>
        {description ? (
          <div className="truncate text-sm text-muted-foreground sm:text-base">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
};
