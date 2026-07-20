"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, CheckCircle2, MoreVertical, Pencil, Trash2, Calendar as CalendarIcon, Flag, Folder, Repeat } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Task, Category, TaskStatus, TaskPriority, RecurrenceType } from "@/types/database";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/lib/utils";

const priorityConfig: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  urgent: { label: "Urgent", color: "text-destructive", dot: "bg-destructive" },
  high: { label: "High", color: "text-warning", dot: "bg-warning" },
  medium: { label: "Medium", color: "text-info", dot: "bg-info" },
  low: { label: "Low", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const statusConfig: Record<TaskStatus, { label: string; badge: string }> = {
  todo: { label: "To Do", badge: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", badge: "bg-info/15 text-info" },
  done: { label: "Done", badge: "bg-success/15 text-success" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "done">("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");

  useEffect(() => { fetchTasks(); fetchCategories(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from("tasks").select("*, category:categories(*)").order("sort_order").order("created_at", { ascending: false });
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories((data as Category[]) || []);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setStatus("todo"); setPriority("medium");
    setCategoryId("none"); setDueDate(""); setRecurrence("none"); setEditingTask(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title); setDescription(task.description || ""); setStatus(task.status);
    setPriority(task.priority); setCategoryId(task.category_id || "none");
    setDueDate(task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : "");
    setRecurrence(task.recurrence); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Task title is required"); return; }
    const payload = {
      title: title.trim(), description: description.trim() || null, status, priority,
      category_id: categoryId === "none" ? null : categoryId,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      recurrence, completed_at: status === "done" ? new Date().toISOString() : null,
    };
    if (editingTask) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editingTask.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Task updated");
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Task created");
    }
    setDialogOpen(false); resetForm(); fetchTasks();
  };

  const toggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    const { error } = await supabase.from("tasks").update({ status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null }).eq("id", task.id);
    if (error) { toast.error(error.message); return; }
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Task deleted"); fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "today") return t.due_date && isToday(new Date(t.due_date));
    if (filter === "pending") return t.status !== "done";
    if (filter === "done") return t.status === "done";
    return true;
  });

  const dueLabel = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isToday(d)) return { label: "Today", variant: "destructive" as const };
    if (isTomorrow(d)) return { label: "Tomorrow", variant: "default" as const };
    if (isPast(d)) return { label: "Overdue", variant: "destructive" as const };
    return { label: format(d, "MMM d"), variant: "secondary" as const };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Manage your tasks with priorities, categories, and recurrence">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Task</Button>
      </PageHeader>

      <div className="flex gap-2">
        {(["all", "today", "pending", "done"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
            {f === "all" ? "All Tasks" : f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-shimmer" />)}</div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No tasks here" description="Create your first task to start organizing your day."
          action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Task</Button>} />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const due = dueLabel(task.due_date);
            const pCfg = priorityConfig[task.priority];
            const sCfg = statusConfig[task.status];
            return (
              <Card key={task.id} className={cn("group flex items-center gap-3 p-4 transition-all hover:shadow-sm", task.status === "done" && "opacity-60")}>
                <button onClick={() => toggleStatus(task)} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", task.status === "done" ? "border-success bg-success text-success-foreground" : "border-muted-foreground hover:border-primary")}>
                  {task.status === "done" && <CheckCircle2 className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium truncate", task.status === "done" && "line-through")}>{task.title}</span>
                    {task.ai_generated && <Badge variant="outline" className="text-xs shrink-0">AI</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("flex items-center gap-1", pCfg.color)}><Flag className="h-3 w-3" />{pCfg.label}</span>
                    {task.category && <span className="flex items-center gap-1"><Folder className="h-3 w-3" />{task.category.name}</span>}
                    {task.recurrence !== "none" && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />{task.recurrence}</span>}
                    {due && <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{due.label}</span>}
                    <span className={cn("rounded px-1.5 py-0.5", sCfg.badge)}>{sCfg.label}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(task)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Add details..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No category</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No repeat</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingTask ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
