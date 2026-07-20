import { useEffect, useState } from "react";
import { Plus, Target, CheckCircle2, MoreVertical, Pencil, Trash2, X, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  type: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: string;
}

export function GoalsPage() {
  const { t } = useI18n();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<"active" | "completed">("active");
  const [menuId, setMenuId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("monthly");
  const [targetValue, setTargetValue] = useState(10);
  const [currentValue, setCurrentValue] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => { fetchGoals(); }, []);

  async function fetchGoals() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
    setGoals((data as Goal[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setTitle(""); setType("monthly"); setTargetValue(10); setCurrentValue(0); setDeadline(""); setStatus("active"); setEditing(null);
  }

  function openCreate() { resetForm(); setDialogOpen(true); }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setTitle(goal.title); setType(goal.type); setTargetValue(goal.target_value); setCurrentValue(goal.current_value); setStatus(goal.status);
    setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: title.trim(),
      type, target_value: targetValue, current_value: currentValue, status,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    };
    
    if (editing) {
      if (!supabase) return;
      const { error } = await supabase.from("goals").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success(t.goals.save);
    } else {
      if (!supabase) return;
      const { error } = await supabase.from("goals").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t.goals.create);
    }
    setDialogOpen(false); resetForm(); fetchGoals();
  }

  async function deleteGoal(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t.goals.delete); fetchGoals();
  }

  async function updateProgress(goal: Goal, newCurrent: number) {
    if (!supabase) return;
    const boundedCurrent = Math.max(0, Math.min(newCurrent, goal.target_value));
    const isCompleted = boundedCurrent >= goal.target_value;
    const newStatus = isCompleted ? "completed" : "active";
    
    const { error } = await supabase
      .from("goals")
      .update({ current_value: boundedCurrent, status: newStatus })
      .eq("id", goal.id);
      
    if (error) { toast.error(error.message); return; }
    if (isCompleted && goal.status !== "completed") toast.success("Goal completed! 🎉");
    fetchGoals();
  }

  const filtered = goals.filter((g) => g.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.goals.title}</h1>
          <p className="text-sm text-muted-foreground">{t.goals.description}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />{t.goals.newGoal}
        </button>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
              filter === f ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {t.goals[f as keyof typeof t.goals]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t.goals.empty}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.goals.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
            return (
              <div key={goal.id} className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-accent px-2 py-1 text-xs font-medium text-muted-foreground">
                        {t.goals[goal.type as keyof typeof t.goals] || goal.type}
                      </span>
                      <h3 className="mt-2 font-semibold line-clamp-1">{goal.title}</h3>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuId(menuId === goal.id ? null : goal.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuId === goal.id && (
                        <div className="absolute end-0 mt-1 z-10 w-40 rounded-lg border border-border bg-card shadow-lg">
                          <button onClick={() => { openEdit(goal); setMenuId(null); }} className="flex w-full items-center gap-2 p-2.5 text-sm hover:bg-accent">
                            <Pencil className="h-4 w-4" />{t.goals.edit}
                          </button>
                          <button onClick={() => { deleteGoal(goal.id); setMenuId(null); }} className="flex w-full items-center gap-2 p-2.5 text-sm text-destructive hover:bg-accent">
                            <Trash2 className="h-4 w-4" />{t.goals.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {goal.deadline && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-end justify-between text-sm">
                    <span className="text-2xl font-bold">{goal.current_value}<span className="text-sm font-normal text-muted-foreground"> / {goal.target_value}</span></span>
                    <span className="font-medium text-primary">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  
                  {goal.status !== "completed" && (
                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => updateProgress(goal, goal.current_value - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent"
                        disabled={goal.current_value <= 0}
                      >-</button>
                      <button 
                        onClick={() => updateProgress(goal, goal.current_value + 1)}
                        className="flex h-8 flex-1 items-center justify-center rounded-lg border border-border hover:bg-accent"
                        disabled={goal.current_value >= goal.target_value}
                      >+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? t.goals.edit : t.goals.newGoal}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.goals.titleField}</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.goals.type}</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                    <option value="daily">{t.goals.daily}</option>
                    <option value="weekly">{t.goals.weekly}</option>
                    <option value="monthly">{t.goals.monthly}</option>
                    <option value="yearly">{t.goals.yearly}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.goals.deadline}</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.goals.targetValue}</label>
                  <input type="number" min="1" value={targetValue} onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.goals.currentValue}</label>
                  <input type="number" min="0" value={currentValue} onChange={(e) => setCurrentValue(parseInt(e.target.value) || 0)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">{t.goals.cancel}</button>
              <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{editing ? t.goals.save : t.goals.create}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
