import { useEffect, useState } from "react";
import { Plus, Repeat, Check, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  name: string;
  frequency: string;
  target_per_week: number;
}

interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string;
  completed: boolean;
}

export function HabitsPage() {
  const { t } = useI18n();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [targetPerWeek, setTargetPerWeek] = useState(7);

  // Get last 7 days
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [habitsRes, logsRes] = await Promise.all([
      supabase.from("habits").select("*").eq("archived", false).order("created_at"),
      supabase.from("habit_logs").select("*").gte("log_date", sevenDaysAgo.toISOString().split("T")[0])
    ]);
    
    setHabits((habitsRes.data as Habit[]) || []);
    setLogs((logsRes.data as HabitLog[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setName(""); setFrequency("daily"); setTargetPerWeek(7); setEditing(null);
  }

  function openCreate() { resetForm(); setDialogOpen(true); }

  function openEdit(habit: Habit) {
    setEditing(habit);
    setName(habit.name); setFrequency(habit.frequency); setTargetPerWeek(habit.target_per_week);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User session not found. Please log in.");
      return;
    }

    const payload = {
      name: name.trim(),
      frequency,
      target_per_week: targetPerWeek,
      user_id: user.id,
    };
    
    if (editing) {
      const { error } = await supabase.from("habits").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success(t.habits.save);
    } else {
      const { error } = await supabase.from("habits").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t.habits.create);
    }
    setDialogOpen(false); resetForm(); fetchData();
  }

  async function deleteHabit(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("habits").update({ archived: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchData();
  }

  async function toggleLog(habitId: string, date: Date) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User session not found. Please log in.");
      return;
    }

    const dateStr = date.toISOString().split("T")[0];
    const existing = logs.find(l => l.habit_id === habitId && l.log_date === dateStr);
    
    if (existing) {
      // Toggle completion state or delete the log (here we delete to untoggle)
      const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("habit_logs").insert({
        habit_id: habitId, log_date: dateStr, completed: true, user_id: user.id
      });
      if (error) { toast.error(error.message); return; }
    }
    fetchData(); // Refresh logs
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.habits.title}</h1>
          <p className="text-sm text-muted-foreground">{t.habits.description}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />{t.habits.newHabit}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Repeat className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t.habits.empty}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.habits.emptyDesc}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 font-semibold w-[200px]">{t.habits.name}</th>
                {days.map((d, i) => (
                  <th key={i} className="p-4 text-center font-semibold text-muted-foreground min-w-[60px]">
                    <div className="text-xs uppercase">{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    <div className="text-foreground">{d.getDate()}</div>
                  </th>
                ))}
                <th className="p-4 w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="p-4 font-medium">{habit.name}</td>
                  {days.map((d, i) => {
                    const dateStr = d.toISOString().split("T")[0];
                    const isLogged = logs.some(l => l.habit_id === habit.id && l.log_date === dateStr && l.completed);
                    
                    return (
                      <td key={i} className="p-4 text-center">
                        <button
                          onClick={() => toggleLog(habit.id, d)}
                          className={cn(
                            "mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all hover:scale-110",
                            isLogged ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary/50 text-transparent"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-4">
                    <div className="relative">
                      <button
                        onClick={() => setMenuId(menuId === habit.id ? null : habit.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuId === habit.id && (
                        <div className="absolute end-0 mt-1 z-10 w-40 rounded-lg border border-border bg-background shadow-lg">
                          <button onClick={() => { openEdit(habit); setMenuId(null); }} className="flex w-full items-center gap-2 p-2.5 hover:bg-accent">
                            <Pencil className="h-4 w-4" />{t.common.profile}
                          </button>
                          <button onClick={() => { deleteHabit(habit.id); setMenuId(null); }} className="flex w-full items-center gap-2 p-2.5 text-destructive hover:bg-accent">
                            <Trash2 className="h-4 w-4" />{t.goals.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? t.goals.edit : t.habits.newHabit}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.habits.name}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.habits.frequency}</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                    <option value="daily">{t.goals.daily}</option>
                    <option value="weekly">{t.goals.weekly}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.habits.targetPerWeek}</label>
                  <input type="number" min="1" max="7" value={targetPerWeek} onChange={(e) => setTargetPerWeek(parseInt(e.target.value) || 1)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">{t.habits.cancel}</button>
              <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{editing ? t.habits.save : t.habits.create}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
