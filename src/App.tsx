import { Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Calendar, Target, Repeat, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { Topbar } from "@/components/topbar";
import { DashboardPage } from "@/pages/dashboard";
import { TasksPage } from "@/pages/tasks";
import { GoalsPage } from "@/pages/goals";
import { HabitsPage } from "@/pages/habits";
import { CalendarPage } from "@/pages/calendar";
import { HealthPage } from "@/pages/health";
import { FinancePage } from "@/pages/finance";
import { SettingsPage } from "@/pages/settings";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "tasks", href: "/tasks", icon: CheckSquare },
  { key: "calendar", href: "/calendar", icon: Calendar },
  { key: "goals", href: "/goals", icon: Target },
  { key: "habits", href: "/habits", icon: Repeat },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

export default function App() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-e border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            L
          </div>
          <span className="text-lg font-bold">{t.appName}</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t.nav[item.key]}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}


