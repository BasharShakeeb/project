import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

    const [profileRes, tasksRes, eventsRes, habitsRes, habitLogsRes, healthRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("tasks").select("*").neq("status", "done").order("priority"),
      supabase.from("events").select("*").gte("start_at", todayStart.toISOString()).lte("start_at", todayEnd.toISOString()).order("start_at"),
      supabase.from("habits").select("*").eq("archived", false),
      supabase.from("habit_logs").select("*").eq("log_date", todayStr),
      supabase.from("health_logs").select("*").eq("log_date", todayStr).maybeSingle(),
    ]);

    const profile = profileRes.data as { daily_work_hours: number; full_name: string | null } | null;
    const tasks = (tasksRes.data || []) as { id: string; title: string; priority: string; due_date: string | null }[];
    const events = (eventsRes.data || []) as { id: string; title: string; start_at: string; end_at: string; all_day: boolean }[];
    const habits = (habitsRes.data || []) as { id: string; name: string }[];
    const habitLogs = (habitLogsRes.data || []) as { habit_id: string }[];
    const health = (healthRes.data as { sleep_hours: number | null; sleep_quality: number | null; water_cups: number; exercise_minutes: number } | null) || null;

    const workHours = profile?.daily_work_hours ?? 8;

    let eventMinutes = 0;
    for (const ev of events) {
      if (!ev.all_day) {
        const start = new Date(ev.start_at).getTime();
        const end = new Date(ev.end_at).getTime();
        eventMinutes += Math.max(0, (end - start) / 60000);
      }
    }
    const availableWorkMinutes = Math.max(0, workHours * 60 - eventMinutes);
    const availableHours = Math.floor(availableWorkMinutes / 60);
    const availableMins = Math.round(availableWorkMinutes % 60);

    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sortedTasks = [...tasks].sort((a, b) => {
      const aDueToday = a.due_date && a.due_date.startsWith(todayStr);
      const bDueToday = b.due_date && b.due_date.startsWith(todayStr);
      if (aDueToday && !bDueToday) return -1;
      if (!aDueToday && bDueToday) return 1;
      return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    });

    const loggedHabitIds = new Set(habitLogs.map((l) => l.habit_id));
    const dueHabits = habits.filter((h) => !loggedHabitIds.has(h.id));

    const sleepHours = health?.sleep_hours ?? null;
    const lowSleep = sleepHours !== null && sleepHours < 6;
    const goodSleep = sleepHours !== null && sleepHours >= 7;

    const lines: string[] = [];
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    lines.push("📅 " + dateStr);
    lines.push("");
    lines.push("You have " + availableHours + "h " + availableMins + "m of focused work time available" + (events.length > 0 ? " (" + events.length + " event" + (events.length > 1 ? "s" : "") + " scheduled)" : "") + ".");

    if (lowSleep) {
      lines.push("");
      lines.push("⚠️ You slept " + sleepHours + "h last night — below optimal. Consider lighter tasks and a short nap.");
    } else if (goodSleep) {
      lines.push("");
      lines.push("✅ Great sleep (" + sleepHours + "h) — you're well-rested for deep work.");
    }

    if (sortedTasks.length > 0) {
      lines.push("");
      lines.push("🎯 Task Plan:");
      let timeAllocated = 0;
      const planTasks: string[] = [];
      const deferredTasks: string[] = [];

      for (const task of sortedTasks) {
        const dueToday = task.due_date && task.due_date.startsWith(todayStr);
        const dueTomorrow = task.due_date && task.due_date.startsWith(tomorrowStr);
        const taskTime = 45;

        if (timeAllocated + taskTime <= availableWorkMinutes) {
          let reason = "";
          if (dueToday) reason = " — due today, do this first";
          else if (task.priority === "urgent") reason = " — urgent priority";
          else if (task.priority === "high") reason = " — high priority";
          planTasks.push("  • " + task.title + reason);
          timeAllocated += taskTime;
        } else {
          let reason = " — lower priority";
          if (dueTomorrow) reason = " — due tomorrow";
          else if (!dueToday && task.priority === "low") reason = " — low priority, can wait";
          deferredTasks.push("  • " + task.title + reason);
        }
      }

      lines.push(...planTasks);
      if (deferredTasks.length > 0) {
        lines.push("");
        lines.push("⏭️ Deferred to tomorrow:");
        lines.push(...deferredTasks);
      }
    } else {
      lines.push("");
      lines.push("✅ No pending tasks — enjoy a lighter day or work on goals!");
    }

    if (dueHabits.length > 0) {
      lines.push("");
      lines.push("🔄 Habits due today:");
      for (const habit of dueHabits.slice(0, 5)) lines.push("  • " + habit.name);
      if (dueHabits.length > 5) lines.push("  • ...and " + (dueHabits.length - 5) + " more");
    }

    if (health && health.exercise_minutes < 30) {
      lines.push("");
      lines.push("💪 Suggestion: Schedule 30 minutes for exercise — you haven't logged any activity yet today.");
    }

    if (health && health.water_cups < 4) {
      lines.push("💧 You've had " + health.water_cups + " glasses of water — aim for 8 today.");
    }

    if (events.length > 0) {
      lines.push("");
      lines.push("📅 Today's events:");
      for (const ev of events.slice(0, 5)) {
        const time = new Date(ev.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        lines.push("  • " + time + " — " + ev.title);
      }
    }

    lines.push("");
    lines.push("Stay focused and make it count! 🚀");

    const plan = lines.join("\n");

    await supabase.from("notifications").insert({
      type: "ai",
      title: "Day plan generated",
      body: "AI planned your day with " + sortedTasks.length + " tasks and " + dueHabits.length + " habits.",
      action_url: "/dashboard",
    });

    return new Response(JSON.stringify({ plan }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
