import { useEffect, useState } from "react";
import { Plus, CheckCircle2, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

export function TasksPage() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "done">("all");
  const [menuId, setMenuId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks((data as Task[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setTitle(""); setDescription(""); setStatus("todo"); setPriority("medium"); setDueDate(""); setEditing(null);
  }

  function openCreate() { resetForm(); setDialogOpen(true); }

  function openEdit(task: Task) {
    setEditing(task);
    setTitle(task.title); setDescription(task.description || ""); setStatus(task.status); setPriority(task.priority);
    setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status, priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    };
    if (editing) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Task updated");
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Task created");
    }
    setDialogOpen(false); resetForm(); fetchTasks();
  }

  async function toggleStatus(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done";
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (error) { toast.error(error.message); return; }
    fetchTasks();
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Task deleted"); fetchTasks();
  }

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return t.status !== "done";
    if (filter === "done") return t.status === "done";
    return true;
  });

  const priorityColors: Record<string, string> = {
    urgent: "bg-destructive", high: "bg-warning", medium: "bg-primary", low: "bg-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.tasks.title}</h1>
          <p className="text-sm text-muted-foreground">{t.tasks.description}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />{t.tasks.newTask}
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "today", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-accent"
            )}
          >
            {f === "all" ? t.tasks.all : f === "today" ? t.tasks.today : f === "pending" ? t.tasks.pending : t.tasks.done}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t.tasks.empty}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.tasks.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div key={task.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
              <button
                onClick={() => toggleStatus(task)}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  task.status === "done" ? "border-success bg-success text-white" : "border-muted-foreground hover:border-primary"
                )}
              >
                {task.status === "done" && <CheckCircle2 className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm font-medium", task.status === "done" && "line-through opacity-60")}>{task.title}</span>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn(priorityColors[task.priority] || "bg-muted-foreground", "h-2 w-2 rounded-full")} />
                  <span>{t.tasks[task.priority as keyof typeof t.tasks] || task.priority}</span>
                  {task.due_date && <span>• {new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuId(menuId === task.id ? null : task.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuId === task.id && (
                  <div className="absolute end-0 mt-1 z-10 w-40 rounded-lg border border-border bg-card shadow-lg">
                    <button onClick={() => { openEdit(task); setMenuId(null); }} className="flex w-full items-center gap-2 p-2.5 text-sm hover:bg-accent">
                      <Pencil className="h-4 w-4" />{t.tasks.edit2}
                    </button>
                    <button onClick={() => { deleteTask(task.id); setMenuId(null); }} className="flex w-full items-center gap-2 p-2.5 text-sm text-destructive hover:bg-accent">
                      <Trash2 className="h-4 w-4" />{t.tasks.delete}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? t.tasks.edit : t.tasks.newTask}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.tasks.titleField}</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.tasks.titlePlaceholder} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.tasks.descriptionField}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.tasks.descPlaceholder} rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.tasks.priority}</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                    <option value="low">{t.tasks.low}</option>
                    <option value="medium">{t.tasks.medium}</option>
                    <option value="high">{t.tasks.high}</option>
                    <option value="urgent">{t.tasks.urgent}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.tasks.status}</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                    <option value="todo">{t.tasks.todo}</option>
                    <option value="in_progress">{t.tasks.inProgress}</option>
                    <option value="done">{t.tasks.completed}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.tasks.dueDate}</label>
                <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">{t.tasks.cancel}</button>
              <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{editing ? t.tasks.save : t.tasks.create}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
