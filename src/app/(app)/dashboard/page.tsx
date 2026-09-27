"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccounts, useTransactions } from "@/lib/hooks/useFinanceData";
import { rangeForPeriod, type PeriodKey } from "@/lib/period";
import { formatCurrency, formatDateLabel } from "@/lib/format";
import { CategoryDonutChart, type CategorySlice } from "@/components/CategoryDonutChart";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_year", label: "This year" },
  { key: "custom", label: "Custom" },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const range = rangeForPeriod(period, { from: customFrom, to: customTo });
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading } = useTransactions({ from: range.from, to: range.to });

  const totalBalance = useMemo(
    () => accounts.filter((a) => !a.is_archived).reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  const income = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const expenses = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const categorySlices: CategorySlice[] = useMemo(() => {
    const map = new Map<string, CategorySlice>();
    for (const t of transactions) {
      if (t.type !== "expense" || !t.category) continue;
      const existing = map.get(t.category.id);
      if (existing) {
        existing.value += t.amount;
      } else {
        map.set(t.category.id, {
          categoryId: t.category.id,
          name: t.category.name,
          value: t.amount,
          color: t.category.color,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const filteredCategoryTransactions = activeCategory
    ? transactions.filter((t) => t.category?.id === activeCategory)
    : null;

  const recent = transactions.slice(0, 8);
  const groupedRecent = useMemo(() => {
    const groups = new Map<string, typeof recent>();
    for (const t of recent) {
      const key = t.transaction_date;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries());
  }, [recent]);

  return (
    <div className="flex flex-col gap-6">
      {/* Balance */}
      <section className="rounded-card border border-border bg-surface p-6">
        <p className="text-sm text-muted">Current balance</p>
        <p className="mt-1 text-4xl font-semibold tabular tracking-tight">
          {accountsLoading ? "—" : formatCurrency(totalBalance)}
        </p>
      </section>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-pill border px-3.5 py-1.5 text-sm transition-colors ${
              period === p.key ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
            />
            <span className="text-muted">–</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* Income / Expense / Net */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs text-muted">Income</p>
          <p className="mt-1 text-lg font-semibold tabular text-income sm:text-xl">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs text-muted">Expenses</p>
          <p className="mt-1 text-lg font-semibold tabular text-expense sm:text-xl">{formatCurrency(expenses)}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs text-muted">Net</p>
          <p className="mt-1 text-lg font-semibold tabular sm:text-xl">{formatCurrency(income - expenses)}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Category chart */}
        <div className="rounded-card border border-border bg-surface p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Spending by category</p>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="text-xs text-accent">
                Clear
              </button>
            )}
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted">Loading…</p>
          ) : (
            <CategoryDonutChart data={categorySlices} onSliceClick={setActiveCategory} />
          )}
          <div className="mt-4 flex flex-col gap-1.5">
            {categorySlices.slice(0, 6).map((s) => (
              <button
                key={s.categoryId}
                onClick={() => setActiveCategory(s.categoryId)}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-bg"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="tabular text-muted">{formatCurrency(s.value)}</span>
              </button>
            ))}
          </div>

          {filteredCategoryTransactions && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs text-muted">Transactions in this category</p>
              <div className="flex flex-col gap-2">
                {filteredCategoryTransactions.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span>{t.description || t.category?.name}</span>
                    <span className="tabular text-expense">-{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-card border border-border bg-surface p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Recent transactions</p>
            <Link href="/transactions" className="text-xs text-accent">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted">Loading…</p>
          ) : groupedRecent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No transactions yet. Tap + Add expense to start.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedRecent.map(([date, items]) => (
                <div key={date}>
                  <p className="mb-2 text-xs text-muted">{formatDateLabel(date)}</p>
                  <div className="flex flex-col gap-2.5">
                    {items.map((t) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs"
                            style={{ backgroundColor: `${t.category?.color ?? "#999"}22`, color: t.category?.color }}
                          >
                            ●
                          </span>
                          <div>
                            <p className="text-sm">{t.description || t.category?.name || "—"}</p>
                            <p className="text-xs text-muted">{t.account?.name}</p>
                          </div>
                        </div>
                        <span className={`tabular text-sm font-medium ${t.type === "income" ? "text-income" : "text-expense"}`}>
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
