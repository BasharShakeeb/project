import { useEffect, useState } from "react";
import { Heart, Activity, Droplets, Moon, Scale, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface HealthLog {
  id?: string;
  log_date: string;
  water_cups: number;
  sleep_hours: number | "";
  weight_kg: number | "";
  exercise_minutes: number;
  mood: number | "";
}

export function HealthPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const todayStr = new Date().toISOString().split("T")[0];
  const [logDate, setLogDate] = useState(todayStr);
  const [logData, setLogData] = useState<HealthLog>({
    log_date: todayStr,
    water_cups: 0,
    sleep_hours: "",
    weight_kg: "",
    exercise_minutes: 0,
    mood: "",
  });

  useEffect(() => { fetchLog(logDate); }, [logDate]);

  async function fetchLog(date: string) {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("health_logs").select("*").eq("log_date", date).maybeSingle();
    
    if (data) {
      setLogData({
        id: data.id,
        log_date: data.log_date,
        water_cups: data.water_cups,
        sleep_hours: data.sleep_hours ?? "",
        weight_kg: data.weight_kg ?? "",
        exercise_minutes: data.exercise_minutes,
        mood: data.mood ?? "",
      });
    } else {
      setLogData({
        log_date: date, water_cups: 0, sleep_hours: "", weight_kg: "", exercise_minutes: 0, mood: "",
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    if (!supabase) { setSaving(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User session not found. Please log in.");
      setSaving(false);
      return;
    }

    const payload = {
      log_date: logDate,
      water_cups: logData.water_cups,
      sleep_hours: logData.sleep_hours === "" ? null : Number(logData.sleep_hours),
      weight_kg: logData.weight_kg === "" ? null : Number(logData.weight_kg),
      exercise_minutes: logData.exercise_minutes,
      mood: logData.mood === "" ? null : Number(logData.mood),
      user_id: user.id,
    };

    if (logData.id) {
      const { error } = await supabase.from("health_logs").update(payload).eq("id", logData.id);
      if (error) toast.error(error.message); else toast.success(t.health.save);
    } else {
      const { error } = await supabase.from("health_logs").insert(payload);
      if (error) toast.error(error.message); else toast.success(t.health.save);
    }
    setSaving(false);
    fetchLog(logDate);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.health.title}</h1>
          <p className="text-sm text-muted-foreground">{t.health.description}</p>
        </div>
        <div>
          <input 
            type="date" 
            value={logDate} 
            onChange={(e) => setLogDate(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500"><Droplets className="h-5 w-5" /></div>
              <h3 className="font-semibold">{t.health.water}</h3>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setLogData({...logData, water_cups: Math.max(0, logData.water_cups - 1)})} className="h-10 w-10 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-xl font-medium">-</button>
              <div className="flex-1 text-center text-3xl font-bold">{logData.water_cups}</div>
              <button onClick={() => setLogData({...logData, water_cups: logData.water_cups + 1})} className="h-10 w-10 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-xl font-medium">+</button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500"><Activity className="h-5 w-5" /></div>
              <h3 className="font-semibold">{t.health.exercise}</h3>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" min="0" 
                value={logData.exercise_minutes} 
                onChange={(e) => setLogData({...logData, exercise_minutes: parseInt(e.target.value) || 0})}
                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-center text-2xl font-bold outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500"><Moon className="h-5 w-5" /></div>
              <h3 className="font-semibold">{t.health.sleep}</h3>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" min="0" max="24" step="0.5"
                value={logData.sleep_hours} 
                onChange={(e) => setLogData({...logData, sleep_hours: e.target.value})}
                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-center text-2xl font-bold outline-none focus:border-primary"
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500"><Scale className="h-5 w-5" /></div>
              <h3 className="font-semibold">{t.health.weight}</h3>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" min="0" step="0.1"
                value={logData.weight_kg} 
                onChange={(e) => setLogData({...logData, weight_kg: e.target.value})}
                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-center text-2xl font-bold outline-none focus:border-primary"
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="sm:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500"><Heart className="h-5 w-5" /></div>
              <h3 className="font-semibold">{t.health.mood}</h3>
            </div>
            <div className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => setLogData({...logData, mood: m})}
                  className={cn(
                    "flex h-14 flex-1 items-center justify-center rounded-lg border-2 text-2xl transition-all",
                    logData.mood === m ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-background grayscale hover:grayscale-0"
                  )}
                >
                  {m === 1 ? '😢' : m === 2 ? '😕' : m === 3 ? '😐' : m === 4 ? '🙂' : '😁'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-border">
        <button 
          onClick={handleSave} 
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? t.common.loading : t.health.save}
        </button>
      </div>
    </div>
  );
}
