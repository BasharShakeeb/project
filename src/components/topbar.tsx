import { Search, Bell, Settings, LogOut, User } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { LanguageToggle } from "@/components/language-toggle";
import { useState, useRef, useEffect } from "react";

export function Topbar() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t.common.search}
          className="h-9 w-full rounded-lg border border-border bg-background ps-9 pe-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <LanguageToggle />

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent">
          <Bell className="h-4 w-4" />
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent"
          >
            <User className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute end-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
              <div className="flex items-center gap-2 p-3 text-sm font-medium">
                <User className="h-4 w-4" />
                {t.common.profile}
              </div>
              <div className="border-t border-border">
                <button className="flex w-full items-center gap-2 p-3 text-sm transition-colors hover:bg-accent">
                  <Settings className="h-4 w-4" />
                  {t.nav.settings}
                </button>
                <button className="flex w-full items-center gap-2 p-3 text-sm text-destructive transition-colors hover:bg-accent">
                  <LogOut className="h-4 w-4" />
                  {t.common.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
