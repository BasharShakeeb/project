import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Target, TrendingUp, Clock, Calendar, Heart, Wallet, Brain, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TaskRow { id: string; title: string; status: string; priority: string; due_date: string | null; }
interface GoalRow { id: string; title: string; current_value: number; target_value: number; }

export function DashboardPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [dayPlan, setDayPlan] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [tasksRes, goalsRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("goals").select("*").eq("status", "active").order("created_at"),
    ]);
    setTasks((tasksRes.data as TaskRow[]) || []);
    setGoals((goalsRes.data as GoalRow[]) || []);
    setLoading(false);
  }

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t.dashboard.greetingMorning;
    if (h < 18) return t.dashboard.greetingAfternoon;
    return t.dashboard.greetingEvening;
  })();

  async function planMyDay() {
    setPlanning(true);
    setDayPlan(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-plan-day`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setDayPlan(data.plan);
      toast.success("Your day is planned!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan day");
    } finally {
      setPlanning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: t.dashboard.statTasks, value: pendingTasks.length, desc: `${completedTasks.length} completed`, icon: CheckCircle2, color: "text-indigo-500" },
    { label: t.dashboard.statGoals, value: goals.length, icon: Target, color: "text-orange-500" },
    { label: t.dashboard.statHabits, value: 0, icon: TrendingUp, color: "text-emerald-500" },
    { label: t.dashboard.statFocus, value: "0h", icon: Clock, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting}!</h1>
          <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <button
          onClick={planMyDay}
          disabled={planning}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {planning ? "..." : t.dashboard.planDay}
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      {dayPlan && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">Your AI-Planned Day</h2>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed">{dayPlan}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
            {s.desc && <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">{t.dashboard.topTasks}</h3>
            <Link to="/tasks" className="text-xs text-primary hover:underline">
              {t.dashboard.viewAll} <ArrowRight className="ms-1 inline h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {pendingTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="flex-1 text-sm font-medium">{task.title}</span>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noTasks}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">{t.dashboard.activeGoals}</h3>
            <Link to="/goals" className="text-xs text-primary hover:underline">
              {t.dashboard.viewAll} <ArrowRight className="ms-1 inline h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {goals.slice(0, 4).map((goal) => {
              const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
              return (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noGoals}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Calendar, label: t.nav.calendar, href: "/calendar", color: "text-blue-500" },
          { icon: Heart, label: "Health", href: "/health", color: "text-rose-500" },
          { icon: Wallet, label: "Finance", href: "/finance", color: "text-amber-500" },
          { icon: Brain, label: "AI", href: "/ai", color: "text-primary" },
        ].map((link) => (
          <Link key={link.href} to={link.href}>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <link.icon className={`h-5 w-5 ${link.color}`} />
              </div>
              <span className="font-medium">{link.label}</span>
              <ArrowRight className="ms-auto h-4 w-4 text-muted-foreground rtl:rotate-180" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
