"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccounts, useCategories, useQuickAddDefaults, useTransactions } from "@/lib/hooks/useFinanceData";
import { todayISO } from "@/lib/format";
import type { TransactionType } from "@/types/database.types";

export function QuickAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { addTransaction } = useTransactions();
  const defaults = useQuickAddDefaults(type);

  const relevantCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  // Prime category/account with the user's last choice for this type, the
  // moment we know it — that's what makes repeat entries near-instant.
  useEffect(() => {
    if (!open) return;
    setCategoryId(defaults.category_id ?? relevantCategories[0]?.id ?? null);
    setAccountId(defaults.account_id ?? accounts[0]?.account_id ?? null);
  }, [open, defaults, relevantCategories, accounts]);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setShowDetails(false);
      setDate(todayISO());
      setDescription("");
      setError(null);
      setType("expense");
    }
  }, [open]);

  if (!open) return null;

  const canSave = Number(amount) > 0 && categoryId && accountId && !saving;

  async function handleSave() {
    if (!canSave || !categoryId || !accountId) return;
    setSaving(true);
    setError(null);
    try {
      await addTransaction({
        type,
        amount: Number(amount),
        category_id: categoryId,
        account_id: accountId,
        transaction_date: date,
        description: description || undefined,
      });
      onClose();
    } catch {
      setError("Couldn't save transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={type === "expense" ? "Add expense" : "Add income"}
    >
      <div
        className="max-h-[92vh] w-full max-w-[460px] overflow-y-auto rounded-t-card border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Type toggle */}
        <div className="mb-5 flex rounded-pill border border-border bg-bg p-1">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-pill py-2 text-sm font-medium capitalize transition-colors ${
                type === t ? "bg-accent text-accent-ink" : "text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-5 flex flex-col items-center">
          <label htmlFor="quick-add-amount" className="mb-1 text-xs text-muted">
            Amount (Rs.)
          </label>
          <input
            id="quick-add-amount"
            type="text"
            inputMode="decimal"
            autoFocus
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(v);
            }}
            className="w-full bg-transparent text-center text-4xl font-semibold tabular text-ink outline-none placeholder:text-muted"
          />
        </div>

        {/* Category grid */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-muted">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {relevantCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs transition-colors ${
                  categoryId === c.id ? "border-accent bg-accent/10 text-ink" : "border-border text-muted"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                  aria-hidden
                />
                <span className="line-clamp-1 text-center">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-muted">Account</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {accounts.map((a) => (
              <button
                key={a.account_id}
                onClick={() => setAccountId(a.account_id)}
                className={`shrink-0 rounded-pill border px-3.5 py-2 text-sm transition-colors ${
                  accountId === a.account_id ? "border-accent bg-accent/10 text-ink" : "border-border text-muted"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Optional details */}
        {!showDetails ? (
          <button onClick={() => setShowDetails(true)} className="mb-4 text-sm font-medium text-accent">
            Add details
          </button>
        ) : (
          <div className="mb-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-border bg-bg px-3.5 py-2 text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Notes (optional)
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lunch with team"
                className="rounded-xl border border-border bg-bg px-3.5 py-2 text-ink outline-none focus:border-accent"
              />
            </label>
          </div>
        )}

        {error && <p className="mb-3 text-sm text-expense">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-ink">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-[2] rounded-xl bg-accent py-3 text-sm font-semibold text-accent-ink transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving…" : `Save ${type === "expense" ? "expense" : "income"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
