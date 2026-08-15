import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  DoorOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useProfile, useSchool } from "@/hooks/useSchoolData";

const NAV = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/enseignants", label: "Enseignants", icon: Users },
  { to: "/matieres", label: "Matières", icon: BookOpen },
  { to: "/classes", label: "Classes", icon: GraduationCap },
  { to: "/salles", label: "Salles", icon: DoorOpen },
  { to: "/emploi-du-temps", label: "Emploi du temps", icon: CalendarClock },
  { to: "/parametres", label: "Établissement", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { data: school } = useSchool();
  const { data: profile } = useProfile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === item.to
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 font-display text-base font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClock className="size-4" />
          </span>
          EDT Genius
        </Link>
        {nav}
        <div className="mt-auto space-y-2 pt-4 text-xs text-muted-foreground">
          <p className="truncate">{school?.name ?? "Établissement non configuré"}</p>
          <p className="truncate">{profile?.email}</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <Menu className="size-4" />
            </Button>
            <span className="font-display text-sm font-semibold">
              {school?.name ?? "EDT Genius"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Changer de thème">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Se déconnecter"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {open ? (
          <div className="no-print border-b border-border bg-sidebar p-4 lg:hidden">{nav}</div>
        ) : null}

        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
