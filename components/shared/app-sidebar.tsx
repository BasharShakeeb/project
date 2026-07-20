"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckCircle2, Calendar, Clock, Target, TrendingUp, Heart, Wallet, FileText, GraduationCap, Brain, Bell, Folder, Settings, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem { href: string; label: string; icon: LucideIcon; badge?: string }

const navSections: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { title: "Productivity", items: [
    { href: "/dashboard/tasks", label: "Tasks", icon: CheckCircle2 },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/time", label: "Time", icon: Clock },
  ]},
  { title: "Growth", items: [
    { href: "/dashboard/goals", label: "Goals", icon: Target },
    { href: "/dashboard/habits", label: "Habits", icon: TrendingUp },
    { href: "/dashboard/study", label: "Study", icon: GraduationCap },
  ]},
  { title: "Wellbeing", items: [
    { href: "/dashboard/health", label: "Health", icon: Heart },
    { href: "/dashboard/finance", label: "Finance", icon: Wallet },
    { href: "/dashboard/notes", label: "Notes", icon: FileText },
  ]},
  { title: "Intelligence", items: [{ href: "/dashboard/ai", label: "AI Assistant", icon: Brain, badge: "AI" }] },
  { title: "System", items: [
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/files", label: "Files", icon: Folder },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]},
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
          <span className="text-lg font-bold tracking-tight">LifeOS</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
