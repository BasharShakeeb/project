import { useEffect, useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, MoreVertical, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
}

export function CalendarPage() {
  const { t } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("events").select("*").order("start_at", { ascending: true });
    setEvents((data as Event[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setTitle(""); setStartAt(""); setEndAt(""); setAllDay(false);
  }

  function openCreate() { resetForm(); setDialogOpen(true); }

  async function handleSave() {
    if (!title.trim() || !startAt || (!allDay && !endAt)) {
      toast.error("Please fill in required fields"); return;
    }
    
    let end = endAt;
    if (allDay) {
      const startObj = new Date(startAt);
      startObj.setHours(23, 59, 59);
      end = startObj.toISOString().slice(0, 16);
    }

    if (new Date(end) < new Date(startAt)) {
      toast.error("End time must be after start time"); return;
    }
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User session not found. Please log in.");
      return;
    }

    const payload = {
      title: title.trim(),
      all_day: allDay,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(end).toISOString(),
      user_id: user.id,
    };
    
    const { error } = await supabase.from("events").insert(payload);
    if (error) { toast.error(error.message); return; }
    
    toast.success(t.calendar.save);
    setDialogOpen(false); resetForm(); fetchEvents();
  }

  async function deleteEvent(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t.goals.delete); fetchEvents();
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter(e => e.start_at >= todayStr);
  const pastEvents = events.filter(e => e.start_at < todayStr);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.calendar.title}</h1>
          <p className="text-sm text-muted-foreground">{t.calendar.description}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />{t.calendar.newEvent}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t.calendar.empty}</h3>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-4 font-semibold text-lg">Upcoming Events</h3>
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-xs font-bold uppercase">{new Date(ev.start_at).toLocaleDateString(undefined, { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{new Date(ev.start_at).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1">{ev.title}</h4>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {ev.all_day ? t.calendar.allDay : (
                          `${new Date(ev.start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(ev.end_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuId(menuId === ev.id ? null : ev.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuId === ev.id && (
                      <div className="absolute end-0 mt-1 z-10 w-40 rounded-lg border border-border bg-card shadow-lg">
                        <button onClick={() => { deleteEvent(ev.id); setMenuId(null); }} className="flex w-full items-center gap-2 p-2.5 text-sm text-destructive hover:bg-accent">
                          <Trash2 className="h-4 w-4" />{t.goals.delete}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground py-4">No upcoming events.</p>}
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold text-lg text-muted-foreground">Past Events</h3>
            <div className="space-y-3 opacity-60">
              {pastEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1 line-through">{ev.title}</h4>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {new Date(ev.start_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} className="h-8 w-8 text-destructive hover:bg-accent rounded-lg flex items-center justify-center">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {pastEvents.length === 0 && <p className="text-sm text-muted-foreground py-4">No past events.</p>}
            </div>
          </div>
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.calendar.newEvent}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.calendar.titleField}</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" autoFocus />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="allday" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <label htmlFor="allday" className="text-sm font-medium">{t.calendar.allDay}</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t.calendar.startAt}</label>
                  <input type={allDay ? "date" : "datetime-local"} value={startAt} onChange={(e) => setStartAt(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
                {!allDay && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t.calendar.endAt}</label>
                    <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">{t.calendar.cancel}</button>
              <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{t.calendar.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
