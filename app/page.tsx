"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Moon, Sun, CheckCircle2, Calendar, Target, TrendingUp, Heart, Wallet, FileText, GraduationCap, Brain } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers";

const features = [
  { icon: CheckCircle2, title: "Smart Tasks", description: "Create, organize, and prioritize tasks with drag-and-drop, recurrence, and categories.", color: "text-indigo-500" },
  { icon: Calendar, title: "Intelligent Calendar", description: "Manage events, reminders, and sync with Google Calendar for a unified schedule.", color: "text-emerald-500" },
  { icon: Target, title: "Goal Tracking", description: "Set yearly, monthly, weekly, and daily goals with progress tracking and completion rates.", color: "text-orange-500" },
  { icon: TrendingUp, title: "Habit Tracker", description: "Build streaks, visualize progress, and get reminders to keep your habits on track.", color: "text-purple-500" },
  { icon: Heart, title: "Health Monitor", description: "Track water intake, sleep, weight, calories, and exercise in one beautiful dashboard.", color: "text-rose-500" },
  { icon: Wallet, title: "Financial Manager", description: "Track income, expenses, budgets, and savings with insightful charts and analysis.", color: "text-amber-500" },
  { icon: FileText, title: "Notes & Knowledge", description: "Write in Markdown, organize with tags, and search across all your notes instantly.", color: "text-cyan-500" },
  { icon: GraduationCap, title: "Study Planner", description: "Manage subjects, assignments, exams, and study sessions to stay on top of academics.", color: "text-blue-500" },
  { icon: Brain, title: "AI Day Planner", description: "One button analyzes your tasks, calendar, sleep, and habits — then builds your optimal day.", color: "text-primary" },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">LifeOS</span>
          </Link>
          <div className="flex items-center gap-2">
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            {user ? (
              <Button asChild><Link href="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:flex"><Link href="/login">Sign In</Link></Button>
                <Button asChild><Link href="/register">Get Started</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-1.5 text-sm backdrop-blur animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Powered by AI Decision Engine</span>
            </div>
            <h1 className="animate-slide-up text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your entire life,<br /><span className="text-gradient">intelligently managed</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl animate-slide-up">
              One unified dashboard for tasks, calendar, goals, habits, health, finances, notes, and studies. With an AI that plans your day like a human assistant would.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up">
              <Button size="lg" asChild className="group">
                <Link href="/register">Start for Free<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild><Link href="/login">Sign In</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-8 sm:p-12">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Brain className="h-4 w-4" /> Signature Feature
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">&ldquo;Plan My Day&rdquo; — one button, full AI analysis</h2>
              <p className="text-muted-foreground text-lg">Click once. The AI analyzes your tasks, calendar events, last night&apos;s sleep, and due habits. It then builds a prioritized schedule with reasoning.</p>
              <div className="rounded-xl border bg-muted/50 p-4 text-sm leading-relaxed">
                <p className="font-medium text-foreground">&ldquo;You have 5 productive hours. Complete Task A first — it&apos;s due today. Then 30 minutes of exercise. Postpone Task B to tomorrow — it&apos;s lower priority.&rdquo;</p>
              </div>
              <p className="text-sm text-muted-foreground">Not a chatbot. A decision engine that reasons about your data.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Analyzes tasks & priorities", icon: CheckCircle2 },
                { label: "Checks calendar for free slots", icon: Calendar },
                { label: "Factors in sleep & energy levels", icon: Heart },
                { label: "Schedules due habits", icon: TrendingUp },
                { label: "Produces a reasoned plan", icon: Brain },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything in one place</h2>
          <p className="mt-4 text-lg text-muted-foreground">Nine powerful modules, working together seamlessly</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-12 text-center text-primary-foreground">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="relative space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to take control of your life?</h2>
            <p className="mx-auto max-w-xl text-primary-foreground/80 text-lg">Join LifeOS today. It&apos;s free, private, and intelligent.</p>
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/register">Get Started Now<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
              <span className="font-bold">LifeOS</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 LifeOS. Your life, intelligently managed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
