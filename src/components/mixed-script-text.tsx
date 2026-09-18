import { splitMixedScript } from "@/lib/study-card";
import { cn } from "cn";

type MixedScriptTextProps = {
  text: string;
  className?: string;
};

/**
 * Renders Persian copy with German tokens isolated so punctuation stays RTL-safe.
 */
export const MixedScriptText = ({ text, className }: MixedScriptTextProps) => {
  const runs = splitMixedScript(text);

  if (runs.length === 0) {
    return null;
  }

  return (
    <span dir="rtl" lang="fa" className={cn("font-[family-name:var(--font-fa)]", className)}>
      {runs.map((run, index) => {
        if (run.lang === "de") {
          return (
            <bdi
              key={`${run.lang}-${index}`}
              dir="ltr"
              lang="de"
              className="mx-1 inline-block font-medium text-foreground [unicode-bidi:isolate]"
            >
              {run.value}
            </bdi>
          );
        }
        return <span key={`${run.lang}-${index}`}>{run.value}</span>;
      })}
    </span>
  );
};
