import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      onClick={toggleLang}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
        className
      )}
      aria-label="Toggle language"
    >
      <Globe className="h-4 w-4" />
      <span className="font-semibold">{lang === "en" ? "عربي" : "EN"}</span>
    </button>
  );
}
