import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";

export function AuthPage() {
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    if (!supabase) {
      toast.error("Supabase client is not initialized.");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Logged in successfully!");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Registered successfully! You can now log in.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
            L
          </div>
          <h1 className="text-2xl font-bold">{t.appName}</h1>
          <p className="text-muted-foreground">{t.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.common.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.common.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t.common.loading : isLogin ? t.common.login : t.common.register}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
