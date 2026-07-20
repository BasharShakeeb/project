"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Target, TrendingUp, Clock, Calendar, Heart, Sparkles, Loader2, Brain, ArrowRight, Zap, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { format, startOfWeek, eachDayOfInterval, isToday } from "date-fns";
import type { Task, Goal, Habit, HabitLog, TimeSession, CalendarEvent } from "@/types/database";
import ProductivityChart from "@/components/charts/productivity-chart";
import TaskDistributionChart from "@/components/charts/task-distribution-chart";
import { toast } from "sonner";

const priorityDot: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  medium: "bg-info",
  low: "bg-muted-foreground",
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [dayPlan, setDayPlan] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [timeSessions, setTimeSessions] = useState<TimeSession[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = new Date(); weekEnd.setHours(23, 59, 59, 999);

    const [tasksRes, goalsRes, habitsRes, habitLogsRes, timeRes, eventsRes] = await Promise.all([
      supabase.from("tasks").select("*").order("sort_order"),
      supabase.from("goals").select("*").eq("status", "active").order("created_at"),
      supabase.from("habits").select("*").eq("archived", false).order("created_at"),
      supabase.from("habit_logs").select("*").gte("log_date", weekStart.toISOString().split("T")[0]).lte("log_date", todayEnd.toISOString().split("T")[0]),
      supabase.from("time_sessions").select("*").gte("started_at", weekStart.toISOString()).lte("started_at", weekEnd.toISOString()),
      supabase.from("events").select("*").gte("start_at", todayStart.toISOString()).lte("start_at", todayEnd.toISOString()),
    ]);

    setTasks(tasksRes.data as Task[] || []);
    setGoals(goalsRes.data as Goal[] || []);
    setHabits(habitsRes.data as Habit[] || []);
    setHabitLogs(habitLogsRes.data as HabitLog[] || []);
    setTimeSessions(timeRes.data as TimeSession[] || []);
    setEvents(eventsRes.data as CalendarEvent[] || []);
    setLoading(false);
  }

  const todayTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const activeGoals = goals;

  const weekDays = eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: new Date() });
  const productivityData = weekDays.map((day) => {
    const dayStr = day.toISOString().split("T")[0];
    const sessions = timeSessions.filter((s) => s.started_at.startsWith(dayStr) && s.duration_minutes);
    const total = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    return { day: format(day, "EEE"), hours: Math.round((total / 60) * 10) / 10 };
  });

  const taskStatusData = [
    { name: "To Do", value: tasks.filter((t) => t.status === "todo").length, color: "hsl(var(--chart-1))" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in_progress").length, color: "hsl(var(--chart-3))" },
    { name: "Done", value: completedTasks.length, color: "hsl(var(--chart-2))" },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  async function planMyDay() {
    setPlanning(true);
    setDayPlan(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-plan-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {profile?.full_name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")} — {todayTasks.length} tasks pending, {events.length} events today
          </p>
        </div>
        <Button size="lg" onClick={planMyDay} disabled={planning}>
          {planning ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Planning...</>
          ) : (
            <><Brain className="mr-2 h-4 w-4" />Plan My Day<Sparkles className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </div>

      {dayPlan && (
        <Card className="border-primary/30 bg-primary/5 p-6 animate-scale-in">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Brain className="h-4 w-4" /></div>
            <h2 className="text-lg font-semibold">Your AI-Planned Day</h2>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{dayPlan}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tasks Today" value={todayTasks.length} description={`${completedTasks.length} completed`} icon={CheckCircle2} iconClassName="text-indigo-500" />
        <StatCard title="Active Goals" value={activeGoals.length} icon={Target} iconClassName="text-orange-500" />
        <StatCard title="Habits Today" value={habits.length} description={`${habitLogs.filter((l) => isToday(new Date(l.log_date)) && l.completed).length} done`} icon={TrendingUp} iconClassName="text-emerald-500" />
        <StatCard title="Focus Hours" value={`${(timeSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / 60).toFixed(1)}h`} description="This week" icon={Clock} iconClassName="text-purple-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Productivity This Week</h3>
          <ProductivityChart data={productivityData} />
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Task Distribution</h3>
          <TaskDistributionChart data={taskStatusData} />
          <div className="mt-4 flex justify-center gap-4 text-xs">
            {taskStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Top Tasks</h3>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/tasks">View all<ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
          </div>
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
                <div className={"h-2 w-2 rounded-full " + (priorityDot[task.priority] || "bg-muted-foreground")} />
                <span className="flex-1 text-sm font-medium">{task.title}</span>
                {task.due_date && isToday(new Date(task.due_date)) && <Badge variant="destructive" className="text-xs">Due today</Badge>}
              </div>
            ))}
            {todayTasks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No pending tasks. You&apos;re all caught up!</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Active Goals</h3>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/goals">View all<ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
          </div>
          <div className="space-y-4">
            {activeGoals.slice(0, 4).map((goal) => {
              const pct = Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100));
              return (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
            {activeGoals.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No active goals yet. Set one to get started!</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Calendar, label: "Calendar", href: "/dashboard/calendar", color: "text-blue-500" },
          { icon: Heart, label: "Health", href: "/dashboard/health", color: "text-rose-500" },
          { icon: Wallet, label: "Finance", href: "/dashboard/finance", color: "text-amber-500" },
          { icon: Zap, label: "AI Assistant", href: "/dashboard/ai", color: "text-primary" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="flex items-center gap-3 p-4 transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <link.icon className={"h-5 w-5 " + link.color} />
              </div>
              <span className="font-medium">{link.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
