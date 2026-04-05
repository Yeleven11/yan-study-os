"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Brain,
  Calendar,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Menu,
  StickyNote,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timeline", label: "Timeline", icon: CalendarDays },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/flashcards", label: "Flashcards", icon: Brain },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/papers", label: "Papers", icon: FileText },
  { href: "/notes", label: "Notes", icon: StickyNote },
];

type SidebarProps = {
  pathname: string;
  onNavigate?: () => void;
};

function Sidebar({ pathname, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--focus)]">
          Yan Study OS
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Plan the week, review smarter, and keep your subject progress visible.
        </p>
      </div>

      <nav className="mt-6 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-[var(--focus)] bg-[var(--panel-soft)] text-[var(--text)]"
                  : "border-transparent text-[var(--muted)] hover:border-[var(--panel-border)] hover:bg-[var(--panel-soft)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function FeaturesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--panel-border)] bg-[var(--panel)] px-4 md:hidden">
        <span className="text-sm font-semibold text-[var(--text)]">Yan Study OS</span>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2 text-[var(--text)]"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--panel-border)] bg-[var(--panel)] transition-transform duration-200 md:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="absolute right-4 top-4 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2 text-[var(--text)]"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <Sidebar pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
      </aside>

      <div className="flex min-h-[calc(100vh-3.5rem)] md:min-h-screen">
        <aside className="hidden w-[220px] shrink-0 border-r border-[var(--panel-border)] bg-[var(--panel)] md:block">
          <div className="sticky top-0 h-screen">
            <Sidebar pathname={pathname} />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
