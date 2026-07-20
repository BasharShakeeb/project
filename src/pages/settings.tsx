import { useEffect, useState } from "react";
import { User, Sun, Moon, Monitor, Clock, Save, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Profile {
  id?: string;
  full_name: string;
  theme: "light" | "dark" | "system";
  language: string;
  work_start_time: string;
  work_end_time: string;
}

export function SettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "", theme: "system", language: "en", work_start_time: "09:00", work_end_time: "17:00",
  });
  const [email, setEmail] = useState("");

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || "");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || "",
          theme: data.theme,
          language: data.language,
          work_start_time: data.work_start_time.slice(0, 5),
          work_end_time: data.work_end_time.slice(0, 5),
        });
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    if (!supabase) { setSaving(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not logged in"); setSaving(false); return; }

    const payload = {
      id: user.id,
      full_name: profile.full_name,
      theme: profile.theme,
      language: profile.language,
      work_start_time: profile.work_start_time,
      work_end_time: profile.work_end_time,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload);
    
    if (error) { 
      toast.error(error.message); 
    } else { 
      toast.success(t.settings.save);
      
      // Update HTML theme
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      if (profile.theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(profile.theme);
      }
      
      // Save lang to local storage to force refresh context if needed
      localStorage.setItem("lifeos_lang", profile.language);
      if (document.documentElement.lang !== profile.language) {
        window.location.reload(); // Reload to apply new language fully across the app
      }
    }
    setSaving(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (loading) {
    return <div className="space-y-4 max-w-2xl mx-auto py-10">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold">{t.settings.title}</h1>
        <p className="text-sm text-muted-foreground">{t.settings.description}</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-6 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t.settings.profile}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.settings.fullName}</label>
            <input 
              value={profile.full_name} 
              onChange={(e) => setProfile({...profile, full_name: e.target.value})}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" 
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" /> Work Start
              </label>
              <input 
                type="time" 
                value={profile.work_start_time} 
                onChange={(e) => setProfile({...profile, work_start_time: e.target.value})}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" /> Work End
              </label>
              <input 
                type="time" 
                value={profile.work_end_time} 
                onChange={(e) => setProfile({...profile, work_end_time: e.target.value})}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" 
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Language</label>
            <select 
              value={profile.language} 
              onChange={(e) => setProfile({...profile, language: e.target.value})}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">App will reload when you save to apply language changes.</p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">{t.settings.theme}</label>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((theme) => {
                const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
                return (
                  <button
                    key={theme}
                    onClick={() => setProfile({...profile, theme})}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-sm transition-all",
                      profile.theme === theme ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium capitalize">{t.settings[theme as keyof typeof t.settings] || theme}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-muted/20 p-4 px-6 flex justify-between items-center">
          <button 
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> {t.common.signOut}
          </button>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-md"
          >
            <Save className="h-4 w-4" />
            {saving ? t.common.loading : t.settings.save}
          </button>
        </div>
      </div>
    </div>
  );
}
