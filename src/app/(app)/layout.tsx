"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickAddModal } from "@/components/QuickAddModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncStatusBadge } from "@/components/SyncStatus";
import { useTransactions } from "@/lib/hooks/useFinanceData";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/transactions", label: "Transactions", icon: "📋" },
  { href: "/accounts", label: "Accounts", icon: "💳" },
  { href: "/budgets", label: "Budgets", icon: "🎯" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/categories", label: "Categories", icon: "🏷️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/transactions", label: "Transactions", icon: "📋" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/settings", label: "More", icon: "⚙️" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { syncStatus } = useTransactions();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop / iPad sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-surface px-4 py-6 sm:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-ink">
            Rs
          </div>
          <span className="text-base font-semibold">Finance</span>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="mb-6 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-ink"
        >
          + Add expense
        </button>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-accent/10 font-medium text-accent" : "text-muted hover:bg-bg"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="mt-4 px-3 py-2 text-left text-sm text-muted hover:text-ink">
          Log out
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-8">
          <SyncStatusBadge status={syncStatus} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-sm text-muted hover:text-ink sm:hidden"
              aria-label="Log out"
            >
              ⎋
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-content flex-1 px-4 pb-28 pt-5 sm:px-8 sm:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span className="text-base" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile FAB */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-ink shadow-lg sm:hidden"
        aria-label="Add expense"
      >
        +
      </button>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
